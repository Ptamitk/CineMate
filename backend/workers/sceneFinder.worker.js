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
          ? `\nConfidence: ${Math.round(result.confidence * 100)}%`
          : "";

      message =
        `Scene identified: ${result.title}` +
        (result.year
          ? ` (${result.year})`
          : "") +
        confidence +
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

const processSceneFinderJob = async (
  jobId,
  uploadedVideo = null
) => {
  let frameDirectory = null;
  let audioDirectory = null;
  let downloadedMediaDirectory = null;

  try {
    const job =
      await SceneFinderJob.findById(
        jobId
      );

    if (!job) {
      throw new Error(
        "Scene Finder job not found."
      );
    }

    const processingJob =
      await SceneFinderJob.findByIdAndUpdate(
        jobId,
        {
          status: "processing",
          error: "",
        },
        {
          new: true,
        }
      );

    await emitSceneEvent(
      processingJob?.user,
      {
        type: "scene",
        jobId:
          processingJob?._id?.toString(),
        status:
          processingJob?.status,
        result:
          processingJob?.result || null,
        error:
          processingJob?.error || "",
      }
    );

    const mediaInput =
      await getMediaInput({
        reelUrl: job.reelUrl,
        uploadedFile: uploadedVideo
          ? {
              path: uploadedVideo,
              mimetype: "video/mp4",
            }
          : job.videoPath
            ? {
                path: job.videoPath,
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
        await SceneFinderJob.findByIdAndUpdate(
          jobId,
          {
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
          {
            new: true,
          }
        );

      await emitSceneEvent(
        updatedJob?.user,
        {
          type: "scene",
          jobId:
            updatedJob?._id?.toString(),
          status:
            updatedJob?.status,
          result:
            updatedJob?.result,
          error:
            updatedJob?.error,
        }
      );

      await sendTelegramFinalResult(
        updatedJob,
        updatedJob?.status,
        updatedJob?.result,
        updatedJob?.error
      );

      return;
    }

    const updatedJob =
      await SceneFinderJob.findByIdAndUpdate(
        jobId,
        {
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
          },
          error: "",
        },
        {
          new: true,
        }
      );

    await emitSceneEvent(
      updatedJob?.user,
      {
        type: "scene",
        jobId:
          updatedJob?._id?.toString(),
        status:
          updatedJob?.status,
        result:
          updatedJob?.result,
        error:
          updatedJob?.error,
      }
    );
    
    await sendTelegramFinalResult(
      updatedJob,
      updatedJob?.status,
      updatedJob?.result,
      updatedJob?.error
    );
  } catch (error) {
    console.error(
      "Scene Finder Worker Error:",
      error.message
    );

    console.error(
      "Scene Finder Worker Stack:",
      error.stack
    );

    const failedJob =
      await SceneFinderJob.findByIdAndUpdate(
        jobId,
        {
          status: "failed",
          error:
            error.message ||
            "Scene processing failed.",
        },
        {
          new: true,
        }
      );

    await emitSceneEvent(
      failedJob?.user,
      {
        type: "scene",
        jobId:
          failedJob?._id?.toString(),
        status:
          failedJob?.status,
        result:
          failedJob?.result || null,
        error:
          failedJob?.error,
      }
    );
    
    await sendTelegramFinalResult(
      failedJob,
      failedJob?.status,
      failedJob?.result,
      failedJob?.error
    );
  } finally {
    await cleanupSceneFiles({
      uploadedVideo,
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