const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
  processSceneFinderJob,
} = require("../../workers/sceneFinder.worker");

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  Number(process.env.SCENE_FINDER_CONCURRENCY || 2)
);

const queue = [];
const activeJobs = new Set();
let draining = false;

const enqueueSceneFinderJob = (
  jobId,
  uploadedVideo = null
) => {
  const normalizedJobId = String(jobId);

  if (activeJobs.has(normalizedJobId)) {
    return false;
  }

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

const runNextJob = async () => {
  if (activeJobs.size >= MAX_CONCURRENT_JOBS) {
    return;
  }

  const next = queue.shift();

  if (!next) {
    return;
  }

  activeJobs.add(next.jobId);

  try {
    await processSceneFinderJob(
      next.jobId,
      next.uploadedVideo
    );
  } catch (error) {
    console.error(
      "Scene Finder Queue Job Error:",
      error.message
    );
  } finally {
    activeJobs.delete(next.jobId);
    drainQueue();
  }
};

const drainQueue = () => {
  if (draining) {
    return;
  }

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
  const jobs =
    await SceneFinderJob.find({
      status: {
        $in: [
          "pending",
          "processing",
        ],
      },
    })
      .select("_id videoPath")
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
      `Recovered ${jobs.length} Scene Finder job(s).`
    );
  }
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
};
