const fs = require("fs");
const path = require("path");
const os = require("os");

const {
runFFmpeg,
} = require("./ffmpeg.service");

const extractAudio = async ({
videoPath,
}) => {
if (!videoPath) {
throw new Error(
"Video path is required for audio extraction."
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
"cinemate-audio-"
)
);

const audioPath = path.join(
  outputDirectory,
  "scene-audio.wav"
);

const MAX_AUDIO_DURATION_SECONDS = Math.max(
  60,
  Number(
    process.env.SCENE_FINDER_MAX_AUDIO_DURATION_SECONDS ||
      10 * 60
  )
);

const MAX_AUDIO_BYTES = Math.max(
  1024 * 1024,
  Number(
    process.env.SCENE_FINDER_MAX_AUDIO_BYTES ||
      25 * 1024 * 1024
  )
);

await runFFmpeg([
  "-i",
  videoPath,
  "-vn",
  "-ac",
  "1",
  "-ar",
  "16000",
  "-t",
  String(MAX_AUDIO_DURATION_SECONDS),
  "-c:a",
  "pcm_s16le",
  audioPath,
]);

const stats = await fs.promises.stat(audioPath);

if (stats.size > MAX_AUDIO_BYTES) {
  await fs.promises.rm(outputDirectory, {
    recursive: true,
    force: true,
  });

  throw new Error(
    "Extracted Scene Finder audio exceeded the safety size limit."
  );
}

return {
outputDirectory,
audioPath,
};
} catch (error) {
  await fs.promises.rm(outputDirectory, { recursive: true, force: true }).catch(() => {});
  throw error;
}
};

module.exports = {
extractAudio,
};
