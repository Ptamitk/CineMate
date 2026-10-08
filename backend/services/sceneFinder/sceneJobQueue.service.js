const SceneFinderJob = require("../../models/sceneFinderJob.model");

const {
  processSceneFinderJob,
} = require("../../workers/sceneFinder.worker");

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  Number(process.env.SCENE_FINDER_CONCURRENCY || 2)
);

const PROCESSING_STALE_MS = Math.max(
  60 * 1000,
  Number(process.env.SCENE_FINDER_PROCESSING_STALE_MS || 5 * 60 * 1000)
);

const MAX_QUEUE_RETRIES = Math.max(
  1,
  Number(process.env.SCENE_FINDER_MAX_QUEUE_RETRIES || 4)
);

const RETRY_BASE_DELAY_MS = Math.max(
  1000,
  Number(process.env.SCENE_FINDER_RETRY_BASE_DELAY_MS || 2000)
);

const RETRY_MAX_DELAY_MS = Math.max(
  RETRY_BASE_DELAY_MS,
  Number(process.env.SCENE_FINDER_RETRY_MAX_DELAY_MS || 60 * 1000)
);

const REDIS_URL = String(process.env.SCENE_FINDER_REDIS_URL || "").trim();
const USE_DISTRIBUTED_QUEUE = Boolean(REDIS_URL);

let distributedQueue = null;
let distributedWorker = null;
let distributedQueueReady = false;

const localQueue = [];
const activeJobs = new Set();
const retryCounts = new Map();
let draining = false;
let recoveryTimer = null;

const QUEUE_RECOVERY_INTERVAL_MS = Math.max(
  30 * 1000,
  Number(process.env.SCENE_FINDER_QUEUE_RECOVERY_INTERVAL_MS || 60 * 1000)
);

const QUEUE_RECOVERY_BATCH_SIZE = Math.max(
  1,
  Number(process.env.SCENE_FINDER_QUEUE_RECOVERY_BATCH_SIZE || 50)
);

const getRedisConnection = () => {
  const url = new URL(REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    db: url.pathname && url.pathname !== "/"
      ? Number(url.pathname.slice(1))
      : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
  };
};

const initializeDistributedQueue = async () => {
  if (!USE_DISTRIBUTED_QUEUE || distributedQueueReady) return false;

  try {
    const { Queue, Worker } = require("bullmq");
    const connection = getRedisConnection();

    distributedQueue = new Queue("cinemate-scene-finder", {
      connection,
      defaultJobOptions: {
        attempts: MAX_QUEUE_RETRIES,
        backoff: {
          type: "exponential",
          delay: RETRY_BASE_DELAY_MS,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 5000,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 10000,
        },
      },
    });

    const path = require("path");
    const processorFile = path.join(
      __dirname,
      "../../workers/sceneFinder.processor.js"
    );

    distributedWorker = new Worker(
      "cinemate-scene-finder",
      processorFile,
      {
        connection,
        concurrency: MAX_CONCURRENT_JOBS,
        lockDuration: Math.max(
          60 * 1000,
          Number(process.env.SCENE_FINDER_WORKER_LOCK_MS || 10 * 60 * 1000)
        ),
        stalledInterval: Math.max(
          15 * 1000,
          Number(process.env.SCENE_FINDER_STALLED_INTERVAL_MS || 30 * 1000)
        ),
        maxStalledCount: Math.max(
          1,
          Number(process.env.SCENE_FINDER_MAX_STALLED_COUNT || 2)
        ),
      }
    );

    distributedWorker.on("completed", (job) => {
      console.log("Scene Finder distributed job completed:", job.id);
    });

    distributedWorker.on("failed", (job, error) => {
      console.error(
        "Scene Finder distributed job failed:",
        job?.id,
        error?.message
      );
    });

    distributedWorker.on("stalled", (jobId) => {
      console.warn("Scene Finder distributed job stalled:", jobId);
    });

    distributedWorker.on("error", (error) => {
      console.error(
        "Scene Finder distributed worker error:",
        error.message
      );
    });

    distributedQueueReady = true;

    console.log(
      "Scene Finder distributed queue enabled (Redis/BullMQ)."
    );

    return true;
  } catch (error) {
    distributedQueue = null;
    distributedWorker = null;
    distributedQueueReady = false;

    console.error(
      "Scene Finder distributed queue initialization failed:",
      error.message
    );

    throw error;
  }
};

const enqueueLocal = (jobId, uploadedVideo = null) => {
  const normalizedJobId = String(jobId);

  if (activeJobs.has(normalizedJobId)) return false;

  if (localQueue.some((item) => item.jobId === normalizedJobId)) {
    return false;
  }

  localQueue.push({
    jobId: normalizedJobId,
    uploadedVideo,
  });

  drainLocalQueue();
  return true;
};

const scheduleLocalRetry = (jobId, uploadedVideo) => {
  const attempts = (retryCounts.get(jobId) || 0) + 1;

  if (attempts >= MAX_QUEUE_RETRIES) {
    retryCounts.delete(jobId);
    return;
  }

  retryCounts.set(jobId, attempts);

  const delay = Math.min(
    RETRY_MAX_DELAY_MS,
    RETRY_BASE_DELAY_MS * 2 ** (attempts - 1)
  );

  const timer = setTimeout(() => {
    if (
      !activeJobs.has(jobId) &&
      !localQueue.some((item) => item.jobId === jobId)
    ) {
      localQueue.push({ jobId, uploadedVideo });
      drainLocalQueue();
    }
  }, delay);

  timer.unref?.();
};

const runLocalJob = async (next) => {
  activeJobs.add(next.jobId);

  try {
    const attemptsMade = retryCounts.get(next.jobId) || 0;

    await processSceneFinderJob(
      next.jobId,
      next.uploadedVideo,
      {
        attemptsMade,
        maxAttempts: MAX_QUEUE_RETRIES,
      }
    );

    retryCounts.delete(next.jobId);
  } catch (error) {
    console.error("Scene Finder Queue Job Error:", error.message);
    scheduleLocalRetry(next.jobId, next.uploadedVideo);
  } finally {
    activeJobs.delete(next.jobId);
    drainLocalQueue();
  }
};

const drainLocalQueue = () => {
  if (draining) return;

  draining = true;

  try {
    while (
      activeJobs.size < MAX_CONCURRENT_JOBS &&
      localQueue.length > 0
    ) {
      const next = localQueue.shift();
      runLocalJob(next).catch((error) => {
        console.error(
          "Scene Finder Queue Job Start Error:",
          error.message
        );
      });
    }
  } finally {
    draining = false;
  }
};

const enqueueSceneFinderJob = async (jobId, uploadedVideo = null) => {
  if (process.env.NODE_ENV === "production" && !USE_DISTRIBUTED_QUEUE) {
    throw new Error(
      "Scene Finder requires SCENE_FINDER_REDIS_URL in production."
    );
  }

  if (USE_DISTRIBUTED_QUEUE) {
    await initializeDistributedQueue();

    if (!distributedQueue) {
      throw new Error(
        "Scene Finder distributed queue is unavailable."
      );
    }

    const normalizedJobId = String(jobId);
    const existing = await distributedQueue.getJob(normalizedJobId);

    if (
      existing &&
      !(await existing.isCompleted()) &&
      !(await existing.isFailed())
    ) {
      return false;
    }

    await distributedQueue.add(
      "scene-analysis",
      {
        jobId: normalizedJobId,
        uploadedVideo,
      },
      {
        jobId: normalizedJobId,
      }
    );

    return true;
  }

  return enqueueLocal(jobId, uploadedVideo);
};

const recoverSceneFinderJobs = async () => {
  if (process.env.NODE_ENV === "production" && !USE_DISTRIBUTED_QUEUE) {
    throw new Error(
      "Scene Finder production recovery requires SCENE_FINDER_REDIS_URL."
    );
  }

  if (USE_DISTRIBUTED_QUEUE) {
    await initializeDistributedQueue();
  }

  const staleBefore = new Date(
    Date.now() - PROCESSING_STALE_MS
  );

  const jobs = await SceneFinderJob.find({
    $or: [
      { status: "pending" },
      {
        status: "processing",
        processingHeartbeatAt: { $lte: staleBefore },
      },
      {
        status: "processing",
        processingHeartbeatAt: null,
        processingStartedAt: { $lte: staleBefore },
      },
      {
        status: "processing",
        processingHeartbeatAt: null,
        processingStartedAt: null,
      },
    ],
  })
    .select("_id videoPath status")
    .sort({ createdAt: 1 })
    .limit(QUEUE_RECOVERY_BATCH_SIZE)
    .lean();

  let queuedCount = 0;

  for (const job of jobs) {
    const queued = await enqueueSceneFinderJob(
      job._id.toString(),
      job.videoPath || null
    );

    if (queued) queuedCount += 1;
  }

  if (queuedCount) {
    console.log(
      "Recovered " + queuedCount + " Scene Finder job(s)."
    );
  }
};

const startSceneFinderQueueRecovery = () => {
  if (recoveryTimer) return;

  recoveryTimer = setInterval(async () => {
    try {
      await recoverSceneFinderJobs();
    } catch (error) {
      console.error(
        "Scene Finder queue recovery error:",
        error.message
      );
    }
  }, QUEUE_RECOVERY_INTERVAL_MS);

  recoveryTimer.unref?.();
};

const closeSceneFinderQueue = async () => {
  if (recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = null;
  }

  if (distributedWorker) {
    await distributedWorker.close();
    distributedWorker = null;
  }

  if (distributedQueue) {
    await distributedQueue.close();
    distributedQueue = null;
  }

  distributedQueueReady = false;
};

const getSceneFinderQueueStatus = () => ({
  mode: USE_DISTRIBUTED_QUEUE ? "redis" : "local",
  queued: USE_DISTRIBUTED_QUEUE ? null : localQueue.length,
  active: USE_DISTRIBUTED_QUEUE ? null : activeJobs.size,
  concurrency: MAX_CONCURRENT_JOBS,
  retries: MAX_QUEUE_RETRIES,
});

module.exports = {
  enqueueSceneFinderJob,
  recoverSceneFinderJobs,
  getSceneFinderQueueStatus,
  startSceneFinderQueueRecovery,
  initializeDistributedQueue,
  closeSceneFinderQueue,
};