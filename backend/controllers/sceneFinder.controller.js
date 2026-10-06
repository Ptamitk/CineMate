const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
  enqueueSceneFinderJob,
} = require("../services/sceneFinder/sceneJobQueue.service");

const {
  cleanupSceneFiles,
} = require("../services/sceneFinder/sceneCleanup.service");

const MAX_ACTIVE_JOBS_PER_USER = Math.max(
  1,
  Number(process.env.SCENE_FINDER_MAX_ACTIVE_JOBS_PER_USER || 2)
);

const isSupportedHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const analyzeScene = async (req, res) => {
  const uploadedVideo = req.file?.path || null;

  try {
    const { reelUrl } = req.body;
    const normalizedReelUrl = reelUrl?.trim() || "";

    if (normalizedReelUrl && uploadedVideo) {
      await cleanupSceneFiles({ uploadedVideo });
      return res.status(400).json({
        message: "Send either a video file or a video URL, not both.",
      });
    }

    if (normalizedReelUrl && !isSupportedHttpUrl(normalizedReelUrl)) {
      await cleanupSceneFiles({ uploadedVideo });
      return res.status(400).json({
        message: "Only HTTP(S) video URLs are supported.",
      });
    }

    if (!normalizedReelUrl && !uploadedVideo) {
      return res.status(400).json({
        message:
          "Video file or video URL is required.",
      });
    }

    const activeJobCount = await SceneFinderJob.countDocuments({
      user: req.userId,
      status: { $in: ["pending", "processing"] },
    });

    if (activeJobCount >= MAX_ACTIVE_JOBS_PER_USER) {
      await cleanupSceneFiles({ uploadedVideo });
      return res.status(429).json({
        message: `You already have ${MAX_ACTIVE_JOBS_PER_USER} Scene Finder jobs running. Please wait for one to finish.`,
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
      const queued = await enqueueSceneFinderJob(
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

    if (!/^[a-f\\d]{24}$/i.test(String(jobId))) {
      return res.status(400).json({
        message: "Invalid Scene Finder job ID.",
      });
    }

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
