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

await runFFmpeg([
"-i",
videoPath,
"-vn",
"-ac",
"1",
"-ar",
"16000",
"-c:a",
"pcm_s16le",
audioPath,
]);

return {
outputDirectory,
audioPath,
};
};

module.exports = {
extractAudio,
};
