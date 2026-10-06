const fs = require("fs");
const path = require("path");
const os = require("os");

const { runFFmpeg } = require("./ffmpeg.service");
const { getVideoDuration } = require("./videoDuration.service");

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

    const targetFrames = Math.min(
      maxFrames,
      Math.max(12, Math.ceil(duration / intervalSeconds))
    );

    const effectiveInterval = Math.max(
      0.5,
      Math.min(intervalSeconds, duration / targetFrames)
    );

    console.log(
      `Scene Finder V4: duration=${duration.toFixed(2)}s frames=${targetFrames} interval=${effectiveInterval.toFixed(2)}s`
    );

    const outputPattern = path.join(
      outputDirectory,
      "frame-%04d.jpg"
    );

    await runFFmpeg([
      "-i",
      videoPath,
      "-vf",
      `fps=1/${effectiveInterval}`,
      "-q:v",
      "2",
      "-frames:v",
      String(targetFrames),
      outputPattern,
    ]);

    const files = await fs.promises.readdir(outputDirectory);

    const frameFiles = files
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .sort(
        (a, b) =>
          Number(a.match(/\d+/)?.[0] || 0) -
          Number(b.match(/\d+/)?.[0] || 0)
      )
      .map((file) => path.join(outputDirectory, file));

    if (!frameFiles.length) {
      throw new Error("No usable video frames were extracted.");
    }

    const targetOcr = Math.min(ocrFrameCount, frameFiles.length);
    const ocrFrameFiles = Array.from(
      { length: targetOcr },
      (_, index) => {
        const position =
          targetOcr === 1
            ? 0
            : Math.round(
                (index * (frameFiles.length - 1)) /
                  (targetOcr - 1)
              );

        return frameFiles[position];
      }
    );

    const frameTimestamps = Object.fromEntries(
      frameFiles.map((file, index) => [
        file,
        Number(Math.min(duration, index * effectiveInterval).toFixed(3)),
      ])
    );

    return {
      outputDirectory,
      frameFiles,
      ocrFrameFiles: [...new Set(ocrFrameFiles)],
      frameTimestamps,
      duration,
      effectiveInterval,
      totalFrames: frameFiles.length,
      selectedFrames: ocrFrameFiles.length,
    };
  } catch (error) {
    await fs.promises.rm(outputDirectory, {
      recursive: true,
      force: true,
    }).catch(() => {});
    throw error;
  }
};

module.exports = {
  extractFrames,
};