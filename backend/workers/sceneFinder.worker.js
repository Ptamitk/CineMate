const crypto = require("crypto");

const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
  getMediaInput,
} = require("../services/sceneFinder/mediaInput.service");

const {
  extractFrames,
} = require("../services/sceneFinder/frameExtraction.service");

const {
  extractAudio,
} = require("../services/sceneFinder/audioExtraction.service");

const {
  analyzeScene,
} = require("../services/sceneFinder/sceneAnalysis.service");

const {
  cleanupSceneFiles,
} = require("../services/sceneFinder/sceneCleanup.service");

const {
  downloadMediaFile,
} = require("../services/sceneFinder/mediaDownload.service");

const {
  emitTelegramSceneResult,
} = require("../services/telegram/telegramEvents.service");

const User = require("../models/user.model");

const {
  telegramRequest,
} = require("../services/telegram/telegram.service");

const WORKER_ID = `scene-${process.pid}-${crypto.randomUUID()}`;

const PROCESSING_STALE_MS = Math.max(
  60 * 1000,
  Number(
    process.env.SCENE_FINDER_PROCESSING_STALE_MS ||
      5 * 60 * 1000
  )
);

const PROCESSING_HEARTBEAT_MS = Math.max(
  15 * 1000,
  Number(
    process.env.SCENE_FINDER_HEARTBEAT_MS ||
      60 * 1000
  )
);

const normalizeCaption = (
  caption = ""
) => {
  return String(caption)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n")
    .trim();
};

const emitSceneEvent = async (
  userId,
  payload
) => {
  if (!userId) {
    return;
  }

  try {
    await emitTelegramSceneResult(
      userId.toString(),
      payload
    );
  } catch (error) {
    console.error(
      "Telegram Scene Event Error:",
      error.message
    );
  }
};

const sendTelegramFinalResult = async (
  job,
  status,
  result,
  error = ""
) => {
  if (
    job?.source !== "telegram" ||
    !job?.user
  ) {
    return;
  }

  try {
    const user = await User.findById(job.user)
      .select("telegramChatId")
      .lean();

    if (!user?.telegramChatId) {
      return;
    }

    let message = "";

    if (
      status === "completed" &&
      result?.title
    ) {
      const confidence =
        typeof result.confidence === "number"
          ? `\nConfidence: ${Math.round(result.confidence)}%`
          : "";

      const evidence =
        result.evidenceType
          ? `\nEvidence: ${String(result.evidenceType).replace(/-/g, " ")}`
          : "";

      const contentType =
        result.contentType === "tv"
          ? "TV series"
          : result.contentType === "movie"
            ? "Movie"
            : "";

      message =
        `Scene identified: ${result.title}` +
        (result.year || result.releaseDate
          ? ` (${result.year || String(result.releaseDate).slice(0, 4)})`
          : "") +
        (contentType
          ? `\nType: ${contentType}`
          : "") +
        confidence +
        evidence +
        "\n\nOpen CineMate to view the full result.";
    } else if (status === "failed") {
      message =
        "Scene analysis failed.\n\n" +
        (error || "Please try the Reel again.");
    } else {
      message =
        "No confident movie or TV match was found.\n\n" +
        "Try a Reel with clearer dialogue, on-screen text, or a recognizable scene.";
    }

    await telegramRequest("sendMessage", {
      chat_id: user.telegramChatId,
      text: message,
    });
  } catch (telegramError) {
    console.error(
      "Telegram Final Result Error:",
      telegramError.message
    );
  }
};

const claimSceneFinderJob = async (
  jobId
) => {
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - PROCESSING_STALE_MS
  );

  return SceneFinderJob.findOneAndUpdate(
    {
      _id: jobId,
      $or: [
        {
          status: "pending",
        },
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
    },
    {
      $set: {
        status: "processing",
        error: "",
        processingStartedAt: now,
        processingHeartbeatAt: now,
        workerId: WORKER_ID,
      },
    },
    {
      new: true,
    }
  );
};

const releaseSceneFinderJob = async (
  jobId,
  update
) => {
  return SceneFinderJob.findOneAndUpdate(
    {
      _id: jobId,
      workerId: WORKER_ID,
      status: "processing",
    },
    {
      ...update,
      $unset: {
        processingStartedAt: 1,
        processingHeartbeatAt: 1,
        workerId: 1,
      },
    },
    {
      new: true,
    }
  );
};

const canCleanupUploadedVideo = async (jobId) => {
  try {
    const job = await SceneFinderJob.findById(jobId)
      .select("status workerId")
      .lean();

    if (!job) {
      return true;
    }

    if (job.status !== "processing") {
      return true;
    }

    return job.workerId === WORKER_ID;
  } catch (error) {
    console.error(
      "Scene Finder upload cleanup ownership check failed:",
      error.message
    );

    // If ownership cannot be verified, leave the upload for
    // stale-temp cleanup rather than risking another worker's file.
    return false;
  }
};

const processSceneFinderJob = async (
  jobId,
  uploadedVideo = null
) => {
  let frameDirectory = null;
  let audioDirectory = null;
  let downloadedMediaDirectory = null;
  let heartbeatTimer = null;
  let heartbeatInFlight = false;
  let leaseLost = false;

  let claimCompleted = false;

  try {
    const processingJob =
      await claimSceneFinderJob(jobId);

    claimCompleted = true;

    if (!processingJob) {
      console.log(
        `Scene Finder job ${jobId} is already completed or actively owned by another worker.`
      );
      return;
    }

    heartbeatTimer = setInterval(
      async () => {
        if (heartbeatInFlight || leaseLost) {
          return;
        }

        heartbeatInFlight = true;

        try {
          const heartbeat =
            await SceneFinderJob.updateOne(
              {
                _id: jobId,
                workerId: WORKER_ID,
                status: "processing",
              },
              {
                $set: {
                  processingHeartbeatAt:
                    new Date(),
                },
              }
            );

          if (heartbeat.modifiedCount !== 1) {
            leaseLost = true;

            console.warn(
              "Scene Finder worker lease lost:",
              jobId
            );
          }
        } catch (error) {
          console.error(
            "Scene Finder Heartbeat Error:",
            error.message
          );
        } finally {
          heartbeatInFlight = false;
        }
      },
      PROCESSING_HEARTBEAT_MS
    );

    await emitSceneEvent(
      processingJob.user,
      {
        type: "scene",
        jobId:
          processingJob._id?.toString(),
        status:
          processingJob.status,
        result:
          processingJob.result || null,
        error:
          processingJob.error || "",
        updatedAt: processingJob.updatedAt,
      }
    );

    const mediaInput =
      await getMediaInput({
        reelUrl: processingJob.reelUrl,
        uploadedFile: uploadedVideo
          ? {
              path: uploadedVideo,
              mimetype: "video/mp4",
            }
          : processingJob.videoPath
            ? {
                path: processingJob.videoPath,
                mimetype: "video/mp4",
              }
            : null,
      });

    const normalizedCaption =
      normalizeCaption(
        mediaInput.caption || ""
      );

    console.log(
      "Scene Finder Media Input:",
      {
        sourceType:
          mediaInput.sourceType,
        originalReelUrl:
          mediaInput.originalReelUrl ||
          "",
        captionLength:
          normalizedCaption.length,
        caption:
          normalizedCaption,
        readyForAnalysis:
          mediaInput.readyForAnalysis,
      }
    );

    let videoPath =
      mediaInput.source;

    if (
      mediaInput.sourceType ===
      "reel_url"
    ) {
      const downloadedMedia =
        await downloadMediaFile(
          mediaInput.mediaUrl ||
            mediaInput.source
        );

      videoPath =
        downloadedMedia.videoPath;

      downloadedMediaDirectory =
        downloadedMedia.outputDirectory;
    }

    const frameResult =
      await extractFrames({
        videoPath,
        intervalSeconds: 2,
        maxFrames: 30,
        ocrFrameCount: 10,
      });

    frameDirectory =
      frameResult.outputDirectory;

    console.log(
      "Frames extracted:",
      frameResult.frameFiles.length
    );

    const audioResult =
      await extractAudio({
        videoPath,
      });

    audioDirectory =
      audioResult.outputDirectory;

    const analysis =
      await analyzeScene({
        frameFiles:
          frameResult.frameFiles,
        ocrFrameFiles:
          frameResult.ocrFrameFiles,
        audioPath:
          audioResult.audioPath,
        caption:
          normalizedCaption,
      });

    console.log(
      "Scene analysis completed."
    );

    const bestMatch =
      analysis.bestMatch;

    if (!bestMatch) {
      const updatedJob =
        await releaseSceneFinderJob(
          jobId,
          {
            $set: {
              status: "completed",
              result: {
                contentId: null,
                contentType: null,
                title: "",
                year: "",
                rating: "",
                image: "",
                confidence: null,
              },
              error:
                "No confident movie or TV match was found.",
            },
          }
        );

      if (!updatedJob) {
        return;
      }

      await emitSceneEvent(
        updatedJob.user,
        {
          type: "scene",
          jobId:
            updatedJob._id?.toString(),
          status:
            updatedJob.status,
          result:
            updatedJob.result,
          error:
            updatedJob.error,
          updatedAt: updatedJob.updatedAt,
        }
      );

      await sendTelegramFinalResult(
        updatedJob,
        updatedJob.status,
        updatedJob.result,
        updatedJob.error
      );

      return;
    }

    const updatedJob =
      await releaseSceneFinderJob(
        jobId,
        {
          $set: {
            status: "completed",
            result: {
              contentId:
                bestMatch.contentId,
              contentType:
                bestMatch.contentType,
              title:
                bestMatch.title || "",
              year:
                bestMatch.releaseDate
                  ? bestMatch.releaseDate.slice(
                      0,
                      4
                    )
                  : "",
              rating:
                bestMatch.rating
                  ? String(
                      bestMatch.rating
                    )
                  : "",
              image:
                bestMatch.image || "",
              confidence:
                bestMatch.confidence ||
                null,
              sceneScore:
                typeof bestMatch.sceneScore === "number"
                  ? bestMatch.sceneScore
                  : null,
              evidenceType:
                bestMatch.evidenceType || "",
            },
            error: "",
          },
        }
      );

    if (!updatedJob) {
      return;
    }

    await emitSceneEvent(
      updatedJob.user,
      {
        type: "scene",
        jobId:
          updatedJob._id?.toString(),
        status:
          updatedJob.status,
        result:
          updatedJob.result,
        error:
          updatedJob.error,
          updatedAt: updatedJob.updatedAt,
      }
    );

    await sendTelegramFinalResult(
      updatedJob,
      updatedJob.status,
      updatedJob.result,
      updatedJob.error
    );
  } catch (error) {
    if (!claimCompleted) {
      throw error;
    }

    console.error(
      "Scene Finder Worker Error:",
      error.message
    );

    console.error(
      "Scene Finder Worker Stack:",
      error.stack
    );

    const failedJob =
      await releaseSceneFinderJob(
        jobId,
        {
          $set: {
            status: "failed",
            error:
              error.message ||
              "Scene processing failed.",
          },
        }
      );

    if (failedJob) {
      await emitSceneEvent(
        failedJob.user,
        {
          type: "scene",
          jobId:
            failedJob._id?.toString(),
          status:
            failedJob.status,
          result:
            failedJob.result || null,
          error:
            failedJob.error,
          updatedAt: failedJob.updatedAt,
        }
      );

      await sendTelegramFinalResult(
        failedJob,
        failedJob.status,
        failedJob.result,
        failedJob.error
      );
    }
  } finally {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    const safeToCleanupUpload =
      uploadedVideo && !leaseLost
        ? await canCleanupUploadedVideo(jobId)
        : false;

    await cleanupSceneFiles({
      uploadedVideo:
        safeToCleanupUpload
          ? uploadedVideo
          : null,
      frameDirectory,
      audioDirectory,
    });

    if (downloadedMediaDirectory) {
      await cleanupSceneFiles({
        frameDirectory:
          downloadedMediaDirectory,
      });
    }
  }
};

module.exports = {
  processSceneFinderJob,
};