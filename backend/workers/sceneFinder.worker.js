const SceneFinderJob = require("../models/sceneFinderJob.model");

const { getMediaInput } = require("../services/sceneFinder/mediaInput.service");
const { extractFrames } = require("../services/sceneFinder/frameExtraction.service");
const { extractAudio } = require("../services/sceneFinder/audioExtraction.service");
const { analyzeScene } = require("../services/sceneFinder/sceneAnalysis.service");
const { cleanupSceneFiles } = require("../services/sceneFinder/sceneCleanup.service");
const { downloadMediaFile } = require("../services/sceneFinder/mediaDownload.service");
const { emitTelegramSceneResult } = require("../services/telegram/telegramEvents.service");

const normalizeCaption = (caption = "") => {
  return String(caption)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
};

const processSceneFinderJob = async (jobId, uploadedVideo = null) => {
  let frameDirectory = null;
  let audioDirectory = null;
  let downloadedMediaDirectory = null;

  try {
    const job = await SceneFinderJob.findById(jobId);

    if (!job) {
      throw new Error("Scene Finder job not found.");
    }

    await SceneFinderJob.findByIdAndUpdate(
      jobId,
      {
        status: "processing",
        error: "",
      },
      {
        returnDocument: "after",
      }
    );

    const mediaInput = await getMediaInput({
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

    const normalizedCaption = normalizeCaption(
      mediaInput.caption || ""
    );

    console.log("Scene Finder Media Input:", {
      sourceType: mediaInput.sourceType,
      originalReelUrl: mediaInput.originalReelUrl || "",
      captionLength: normalizedCaption.length,
      caption: normalizedCaption,
      readyForAnalysis: mediaInput.readyForAnalysis,
    });

    let videoPath = mediaInput.source;

    if (mediaInput.sourceType === "reel_url") {
      const downloadedMedia = await downloadMediaFile(
        mediaInput.mediaUrl || mediaInput.source
      );

      videoPath = downloadedMedia.videoPath;
      downloadedMediaDirectory = downloadedMedia.outputDirectory;
    }

    const frameResult = await extractFrames({
      videoPath,
      intervalSeconds: 2,
    });

    frameDirectory = frameResult.outputDirectory;

    console.log(
      "Frames extracted:",
      frameResult.frameFiles.length
    );

    const audioResult = await extractAudio({
      videoPath,
    });

    audioDirectory = audioResult.outputDirectory;

    console.log(
      "Audio extracted:",
      audioResult.audioPath
    );

    console.log(
      "SCENE FINDER REEL CAPTION:",
      normalizedCaption
    );

    const analysis = await analyzeScene({
      frameFiles: frameResult.frameFiles,
      audioPath: audioResult.audioPath,
      caption: normalizedCaption,
    });

    console.log("Scene analysis completed.");

    console.log(
      "SCENE ANALYSIS BEST MATCH:",
      analysis.bestMatch || null
    );

    const bestMatch = analysis.bestMatch;

    if (!bestMatch) {
      const updatedJob = await SceneFinderJob.findByIdAndUpdate(
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
          error: "No confident movie or TV match was found.",
        },
        {
          returnDocument: "after",
        }
      );

      if (updatedJob?.user) {
        emitTelegramSceneResult(
          updatedJob.user.toString(),
          {
            type: "scene",
            jobId: updatedJob._id.toString(),
            status: updatedJob.status,
            result: updatedJob.result,
            error: updatedJob.error,
          }
        );
      }

      return;
    }

    const updatedJob = await SceneFinderJob.findByIdAndUpdate(
      jobId,
      {
        status: "completed",
        result: {
          contentId: bestMatch.contentId,
          contentType: bestMatch.contentType,
          title: bestMatch.title || "",
          year: bestMatch.releaseDate
            ? bestMatch.releaseDate.slice(0, 4)
            : "",
          rating: bestMatch.rating
            ? String(bestMatch.rating)
            : "",
          image: bestMatch.image || "",
          confidence: bestMatch.confidence || null,
        },
        error: "",
      },
      {
        returnDocument: "after",
      }
    );

    if (updatedJob?.user) {
      emitTelegramSceneResult(
        updatedJob.user.toString(),
        {
          type: "scene",
          jobId: updatedJob._id.toString(),
          status: updatedJob.status,
          result: updatedJob.result,
          error: updatedJob.error,
        }
      );
    }
  } catch (error) {
    console.error(
      "Scene Finder Worker Error:",
      error.message
    );

    console.error(
      "Scene Finder Worker Stack:",
      error.stack
    );

    const failedJob = await SceneFinderJob.findByIdAndUpdate(
      jobId,
      {
        status: "failed",
        error:
          error.message ||
          "Scene processing failed.",
      },
      {
        returnDocument: "after",
      }
    );

    if (failedJob?.user) {
      emitTelegramSceneResult(
        failedJob.user.toString(),
        {
          type: "scene",
          jobId: failedJob._id.toString(),
          status: failedJob.status,
          result: failedJob.result || null,
          error: failedJob.error,
        }
      );
    }
  } finally {
    await cleanupSceneFiles({
      uploadedVideo,
      frameDirectory,
      audioDirectory,
    });

    if (downloadedMediaDirectory) {
      await cleanupSceneFiles({
        frameDirectory: downloadedMediaDirectory,
      });
    }
  }
};

module.exports = {
  processSceneFinderJob,
};