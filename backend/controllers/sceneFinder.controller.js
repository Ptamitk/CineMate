const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
  enqueueSceneFinderJob,
} = require("../services/sceneFinder/sceneJobQueue.service");

const {
  cleanupSceneFiles,
} = require("../services/sceneFinder/sceneCleanup.service");

const analyzeScene = async (req, res) => {
  const uploadedVideo = req.file?.path || null;

  try {
    const { reelUrl } = req.body;
    const normalizedReelUrl = reelUrl?.trim() || "";

    if (!normalizedReelUrl && !uploadedVideo) {
      return res.status(400).json({
        message:
          "Instagram Reel URL or video file is required.",
      });
    }

    let job;

    try {
      job = await SceneFinderJob.create({
        user: req.userId,
        reelUrl: normalizedReelUrl,
        videoPath: uploadedVideo || "",
        source: "web",
        status: "pending",
      });
    } catch (error) {
      if (error?.code !== 11000 || !normalizedReelUrl) {
        throw error;
      }

      const existingJob = await SceneFinderJob.findOne({
        user: req.userId,
        reelUrl: normalizedReelUrl,
        status: {
          $in: ["pending", "processing"],
        },
      });

      if (!existingJob) {
        throw error;
      }

      // Multer has already persisted this upload, but the duplicate
      // request will not use it. Remove it immediately instead of
      // leaving an orphaned temp video behind.
      await cleanupSceneFiles({
        uploadedVideo,
      });

      return res.status(200).json({
        message: "This Reel is already being analyzed.",
        job: {
          id: existingJob._id,
          status: existingJob.status,
        },
      });
    }

    try {
      // Queue processing so heavy Scene Finder jobs are bounded.
      const queued = enqueueSceneFinderJob(
        job._id.toString(),
        uploadedVideo
      );

      if (!queued) {
        throw new Error(
          "Scene Finder job could not be queued."
        );
      }
    } catch (error) {
      // Do not leave a newly-created job stuck in pending when the
      // in-process queue rejects it before processing starts.
      await SceneFinderJob.updateOne(
        {
          _id: job._id,
          status: "pending",
        },
        {
          $set: {
            status: "failed",
            error:
              "Scene analysis could not be queued. Please try again.",
          },
        }
      );

      await cleanupSceneFiles({
        uploadedVideo,
      });

      throw error;
    }

    return res.status(201).json({
      message: "Scene analysis job created.",
      job: {
        id: job._id,
        status: job.status,
      },
    });
  } catch (error) {
    // If job creation itself failed, no worker owns the upload, so it
    // is safe to remove the temporary file here.
    await cleanupSceneFiles({
      uploadedVideo,
    });

    console.error(
      "Scene Finder Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while creating the scene analysis job.",
    });
  }
};

const getSceneAnalysisStatus = async (
  req,
  res
) => {
  try {
    const { jobId } = req.params;

    const job = await SceneFinderJob.findOne({
      _id: jobId,
      user: req.userId,
    });

    if (!job) {
      return res.status(404).json({
        message: "Scene analysis job not found.",
      });
    }

    return res.status(200).json({
      job: {
        id: job._id,
        status: job.status,
        result: job.result,
        error: job.error,
      },
    });
  } catch (error) {
    console.error(
      "Scene Finder Status Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching scene analysis status.",
    });
  }
};

module.exports = {
  analyzeScene,
  getSceneAnalysisStatus,
};
