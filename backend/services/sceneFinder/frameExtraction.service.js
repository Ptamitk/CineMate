const fs = require("fs");
const path = require("path");
const os = require("os");

const { runFFmpeg } = require("./ffmpeg.service");
const { getVideoDuration } = require("./videoDuration.service");
const {
  buildAdaptiveSamplingPlan,
  pickRepresentativeFrames,
} = require("./adaptiveFrameSampler.service");

const MAX_VIDEO_DURATION_SECONDS = Math.max(
  30,
  Number(process.env.SCENE_FINDER_MAX_DURATION_SECONDS || 10 * 60)
);

const extractFrames = async ({
  videoPath,
  intervalSeconds = 1.5,
  maxFrames = 48,
  ocrFrameCount = 8,
}) => {
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error("Video file was not found.");
  }

  const outputDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "cinemate-scene-")
  );

  try {
    const duration = await getVideoDuration(videoPath);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Could not determine a valid Scene Finder video duration.");
    }

    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      throw new Error(
        `Scene Finder videos are limited to ${MAX_VIDEO_DURATION_SECONDS} seconds.`
      );
    }

    const plan = buildAdaptiveSamplingPlan({
      durationSeconds: duration,
      requestedInterval: intervalSeconds,
      requestedMaxFrames: maxFrames,
      requestedOcrFrames: ocrFrameCount,
    });

    console.log(
      `Scene Finder adaptive extraction: strategy=${plan.strategy} duration=${duration.toFixed(2)}s sampleInterval=${plan.intervalSeconds.toFixed(2)}s totalFrames=${plan.targetFrames}`
    );

    const outputPattern = path.join(outputDirectory, "frame-%04d.jpg");

    await runFFmpeg([
      "-i",
      videoPath,
      "-vf",
      `fps=1/${plan.intervalSeconds}`,
      "-q:v",
      "2",
      "-frames:v",
      String(plan.targetFrames),
      outputPattern,
    ]);

    const files = await fs.promises.readdir(outputDirectory);
    const frameFiles = files
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .sort(
        (a, b) =>
          Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0)
      )
      .map((file) => path.join(outputDirectory, file));

    if (!frameFiles.length) {
      throw new Error("No usable video frames were extracted.");
    }

    const representativeFrames = pickRepresentativeFrames({
      frameFiles,
      durationSeconds: duration,
      targetCount: plan.targetRepresentativeFrames,
      strategy: plan.strategy,
    });

    const ocrFrameFiles = representativeFrames
      .slice(0, plan.ocrFrameCount)
      .map((frame) => frame.framePath);

    return {
      outputDirectory,
      frameFiles: representativeFrames.map((frame) => frame.framePath),
      ocrFrameFiles: [...new Set(ocrFrameFiles)],
      totalFrames: representativeFrames.length,
      selectedFrames: ocrFrameFiles.length,
      frameMetadata: representativeFrames,
      strategy: plan.strategy,
    };
  } catch (error) {
    await fs.promises.rm(outputDirectory, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
};

module.exports = {
  extractFrames,
};
