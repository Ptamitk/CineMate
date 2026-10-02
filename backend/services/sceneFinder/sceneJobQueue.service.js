const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
  processSceneFinderJob,
} = require("../../workers/sceneFinder.worker");

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  Number(process.env.SCENE_FINDER_CONCURRENCY || 2)
);

const PROCESSING_STALE_MS = Math.max(
  60 * 1000,
  Number(
    process.env.SCENE_FINDER_PROCESSING_STALE_MS ||
      5 * 60 * 1000
  )
);

const MAX_QUEUE_RETRIES = Math.max(
  3,
  Number(
    process.env.SCENE_FINDER_MAX_QUEUE_RETRIES || 8
  )
);
const RETRY_BASE_DELAY_MS = Math.max(
  1000,
  Number(
    process.env.SCENE_FINDER_RETRY_BASE_DELAY_MS || 2000
  )
);
const RETRY_MAX_DELAY_MS = Math.max(
  RETRY_BASE_DELAY_MS,
  Number(
    process.env.SCENE_FINDER_RETRY_MAX_DELAY_MS ||
      60 * 1000
  )
);

const queue = [];
const activeJobs = new Set();
const retryCounts = new Map();
let draining = false;
let recoveryTimer = null;

const QUEUE_RECOVERY_INTERVAL_MS = Math.max(
  30 * 1000,
  Number(
    process.env.SCENE_FINDER_QUEUE_RECOVERY_INTERVAL_MS ||
      60 * 1000
  )
);

const enqueueSceneFinderJob = (
  jobId,
  uploadedVideo = null
) => {
  const normalizedJobId = String(jobId);

  if (activeJobs.has(normalizedJobId)) return false;

  if (
    queue.some(
      (item) => item.jobId === normalizedJobId
    )
  ) {
    return false;
  }

  queue.push({
    jobId: normalizedJobId,
    uploadedVideo,
  });

  drainQueue();
  return true;
};

const scheduleRetry = (
  jobId,
  uploadedVideo
) => {
  const attempts =
    (retryCounts.get(jobId) || 0) + 1;

  if (attempts > MAX_QUEUE_RETRIES) {
    retryCounts.delete(jobId);

    console.error(
      "Scene Finder job " +
        jobId +
        " could not be claimed after " +
        MAX_QUEUE_RETRIES +
        " retries; leaving it recoverable for the queue watchdog/startup recovery."
    );

    return;
  }

  retryCounts.set(jobId, attempts);

  const delay = Math.min(
    RETRY_MAX_DELAY_MS,
    RETRY_BASE_DELAY_MS *
      2 ** (attempts - 1)
  );

  const timer = setTimeout(() => {
    if (
      !activeJobs.has(jobId) &&
      !queue.some(
        (item) => item.jobId === jobId
      )
    ) {
      queue.push({
        jobId,
        uploadedVideo,
      });

      drainQueue();
    }
  }, delay);

  timer.unref?.();
};

const runNextJob = async () => {
  if (
    activeJobs.size >=
    MAX_CONCURRENT_JOBS
  ) {
    return;
  }

  const next = queue.shift();

  if (!next) return;

  activeJobs.add(next.jobId);

  try {
    await processSceneFinderJob(
      next.jobId,
      next.uploadedVideo
    );

    retryCounts.delete(next.jobId);
  } catch (error) {
    console.error(
      "Scene Finder Queue Job Error:",
      error.message
    );

    scheduleRetry(
      next.jobId,
      next.uploadedVideo
    );
  } finally {
    activeJobs.delete(next.jobId);
    drainQueue();
  }
};

const drainQueue = () => {
  if (draining) return;

  draining = true;

  try {
    while (
      activeJobs.size <
        MAX_CONCURRENT_JOBS &&
      queue.length > 0
    ) {
      runNextJob().catch((error) => {
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

const recoverSceneFinderJobs = async () => {
  const staleBefore = new Date(
    Date.now() - PROCESSING_STALE_MS
  );

  const jobs =
    await SceneFinderJob.find({
      $or: [
        { status: "pending" },
        {
          status: "processing",
          processingHeartbeatAt: {
            $lte: staleBefore,
          },
        },
        {
          status: "processing",
          processingHeartbeatAt: null,
          processingStartedAt: {
            $lte: staleBefore,
          },
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
      .lean();

  for (const job of jobs) {
    enqueueSceneFinderJob(
      job._id.toString(),
      job.videoPath || null
    );
  }

  if (jobs.length) {
    console.log(
      "Recovered " +
        jobs.length +
        " Scene Finder job(s)."
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

const getSceneFinderQueueStatus = () => ({
  queued: queue.length,
  active: activeJobs.size,
  concurrency: MAX_CONCURRENT_JOBS,
});

module.exports = {
  enqueueSceneFinderJob,
  recoverSceneFinderJobs,
  getSceneFinderQueueStatus,
  startSceneFinderQueueRecovery,
};
