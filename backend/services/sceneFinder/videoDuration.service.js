const { runFFmpeg } = require("./ffmpeg.service");

const getVideoDuration = async (videoPath) => {
  if (!videoPath) {
    throw new Error("Video path is required.");
  }

  const result = await runFFmpeg(
    ["-hide_banner", "-i", videoPath],
    { allowNonZeroExit: true }
  );

  const match = result.stderr.match(
    /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/
  );

  if (!match) {
    throw new Error(
      "Could not determine video duration."
    );
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  return hours * 3600 + minutes * 60 + seconds;
};

module.exports = {
  getVideoDuration,
};