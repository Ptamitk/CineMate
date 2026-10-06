require("dotenv").config();

const connectDB = require("../config/db");
const { processSceneFinderJob } = require("./sceneFinder.worker");

let dbReady = null;

module.exports = async (job) => {
  if (!dbReady) {
    dbReady = connectDB();
  }

  await dbReady;

  return processSceneFinderJob(
    job.data.jobId,
    job.data.uploadedVideo || null,
    {
      attemptsMade: Number(job.attemptsMade || 0),
      maxAttempts: Number(
        process.env.SCENE_FINDER_MAX_QUEUE_RETRIES || 4
      ),
    }
  );
};
