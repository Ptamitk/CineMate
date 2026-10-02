const fs = require("fs");
const path = require("path");
const os = require("os");

const { runFFmpeg } = require("./ffmpeg.service");
const { getVideoDuration } = require("./videoDuration.service");

const MAX_VIDEO_DURATION_SECONDS = Math.max(
  30,
  Number(
    process.env.SCENE_FINDER_MAX_DURATION_SECONDS ||
      10 * 60
  )
);

const extractFrames = async ({
  videoPath,
  intervalSeconds = 2,
  maxFrames = 30,
  ocrFrameCount = 10,
}) => {
  if (!videoPath) {
    throw new Error(
      "Video path is required for frame extraction."
    );
  }

  if (!fs.existsSync(videoPath)) {
    throw new Error(
      "Video file was not found."
    );
  }

  const outputDirectory =
    await fs.promises.mkdtemp(
      path.join(
        os.tmpdir(),
        "cinemate-scene-"
      )
    );

  const outputPattern = path.join(
    outputDirectory,
    "frame-%04d.jpg"
  );

  const duration =
    await getVideoDuration(videoPath);

  if (!Number.isFinite(duration) || duration <= 0) {
    await fs.promises.rm(outputDirectory, {
      recursive: true,
      force: true,
    });

    throw new Error(
      "Could not determine a valid Scene Finder video duration."
    );
  }

  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    await fs.promises.rm(outputDirectory, {
      recursive: true,
      force: true,
    });

    throw new Error(
      `Scene Finder videos are limited to ${MAX_VIDEO_DURATION_SECONDS} seconds.`
    );
  }

  console.log(
    `Video duration: ${duration.toFixed(2)} seconds`
  );

  const calculatedInterval =
    duration / maxFrames;

  const effectiveInterval =
    Math.max(
      0.5,
      Math.min(
        intervalSeconds,
        calculatedInterval
      )
    );

  console.log(
    `Frame interval: ${effectiveInterval.toFixed(2)} seconds`
  );

  await runFFmpeg([
    "-i",
    videoPath,
    "-vf",
    `fps=1/${effectiveInterval}`,
    "-q:v",
    "2",
    "-frames:v",
    String(maxFrames),
    outputPattern,
  ]);

  const files =
    await fs.promises.readdir(
      outputDirectory
    );

  const frameFiles = files
    .filter((file) =>
      /^frame-\d+\.jpg$/i.test(file)
    )
    .sort(
      (a, b) =>
        Number(
          a.match(/\d+/)?.[0] || 0
        ) -
        Number(
          b.match(/\d+/)?.[0] || 0
        )
    )
    .map((file) =>
      path.join(
        outputDirectory,
        file
      )
    );

  console.log(
    `Frames extracted: ${frameFiles.length}`
  );

  const targetCount = Math.min(
    ocrFrameCount,
    frameFiles.length
  );

  let selectedFrameFiles =
    frameFiles;

  if (
    frameFiles.length >
    targetCount
  ) {
    selectedFrameFiles =
      Array.from(
        { length: targetCount },
        (_, index) => {
          const position =
            targetCount === 1
              ? 0
              : Math.round(
                  (
                    index *
                    (frameFiles.length - 1)
                  ) /
                  (targetCount - 1)
                );

          return frameFiles[position];
        }
      );
  }

  console.log(
    `Frames selected for OCR: ${selectedFrameFiles.length}`
  );

  return {
    outputDirectory,
    frameFiles,
    ocrFrameFiles:
      selectedFrameFiles,
    totalFrames:
      frameFiles.length,
    selectedFrames:
      selectedFrameFiles.length,
  };
};

module.exports = {
  extractFrames,
};