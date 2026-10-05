const { runFFmpeg } = require("./ffmpeg.service");

const parseFfmpegMetadata = (rawText = "") => {
  const text = String(rawText || "");

  const durationMatch = text.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
  const videoMatch = text.match(/Stream #0:(\d+)(?:\([^\)]*\))?: Video: ([^,]+),\s*([^,]+),\s*(\d+)x(\d+)(?:,|\s)/i);
  const audioMatch = text.match(/Stream #0:(\d+)(?:\([^\)]*\))?: Audio: ([^,]+)/i);
  const frameRateMatch = text.match(/,\s*([0-9.]+)\s*(?:fps|tbr|tb r|tbc)/i);

  const duration = durationMatch
    ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
    : null;

  const width = videoMatch ? Number(videoMatch[4]) : null;
  const height = videoMatch ? Number(videoMatch[5]) : null;
  const codec = videoMatch ? videoMatch[2].trim() : null;
  const fps = frameRateMatch ? Number(frameRateMatch[1]) : null;
  const hasAudio = Boolean(audioMatch);

  return {
    duration,
    width,
    height,
    fps,
    codec,
    audioPresent: hasAudio,
    audioCodec: audioMatch ? audioMatch[2].trim() : null,
    aspectRatio: width && height ? width / height : null,
    orientation: width && height ? (width >= height ? "landscape" : "portrait") : null,
    valid: Number.isFinite(duration) && duration > 0 && width > 0 && height > 0,
  };
};

const extractVideoMetadata = async (videoPath) => {
  if (!videoPath) {
    throw new Error("Video path is required.");
  }

  const result = await runFFmpeg(["-hide_banner", "-i", videoPath], { allowNonZeroExit: true });
  const meta = parseFfmpegMetadata(result.stderr || result.stdout || "");

  if (!meta.valid) {
    throw new Error("Unsupported or unreadable video file.");
  }

  return {
    duration: Number(meta.duration),
    width: Number(meta.width),
    height: Number(meta.height),
    fps: meta.fps ? Number(meta.fps) : null,
    codec: meta.codec,
    audioPresent: Boolean(meta.audioPresent),
    audioCodec: meta.audioCodec,
    aspectRatio: meta.aspectRatio,
    orientation: meta.orientation,
    valid: true,
  };
};

module.exports = {
  parseFfmpegMetadata,
  extractVideoMetadata,
};
