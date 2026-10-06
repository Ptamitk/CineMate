const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const parseFfmpegMetadata = (ffmpegOutput = '') => {
  if (!ffmpegOutput || typeof ffmpegOutput !== 'string') {
    return { valid: false, error: 'No FFmpeg output provided' };
  }

  try {
    const durationMatch = ffmpegOutput.match(/Duration: ([\d:]+)/);
    const videoMatch = ffmpegOutput.match(/Video: ([^,]+),\s*([^,]+),\s*(\d+)x(\d+)/);
    const audioMatch = ffmpegOutput.match(/Audio: ([^,]+)/);

    if (!durationMatch || !videoMatch) {
      return { valid: false, error: 'Missing duration or video stream' };
    }

    const [hours, minutes, seconds] = durationMatch[1].split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const width = Number(videoMatch[3]);
    const height = Number(videoMatch[4]);
    const codec = videoMatch[1].trim();
    const pixelFormat = videoMatch[2].trim();

    if (totalSeconds <= 0 || width < 320 || height < 180) {
      return { valid: false, error: 'Invalid video dimensions or duration' };
    }

    return {
      valid: true,
      durationSeconds: Number(totalSeconds.toFixed(3)),
      width,
      height,
      aspectRatio: Number((width / height).toFixed(3)),
      codec,
      pixelFormat,
      audioPresent: Boolean(audioMatch),
      audioCodec: audioMatch ? audioMatch[1].trim() : null,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const validateVideoFile = (filePath = '') => {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid file path' };
  }

  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    const stats = fs.statSync(filePath);
    const maxSizeBytes = 5 * 1024 * 1024 * 1024; // 5GB
    const minSizeBytes = 1024 * 100; // 100KB

    if (stats.size < minSizeBytes || stats.size > maxSizeBytes) {
      return { valid: false, error: `Invalid file size: ${stats.size} bytes` };
    }

    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.flv', '.m4v'];
    if (!supportedFormats.includes(ext)) {
      return { valid: false, error: `Unsupported format: ${ext}` };
    }

    return { valid: true, filePath, fileSize: stats.size, format: ext };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

const probeVideoMetadata = (filePath = '') => {
  const validation = validateVideoFile(filePath);
  if (!validation.valid) return validation;

  try {
    const ffprobeCmd = `ffprobe -v error -show_format -show_streams "${filePath}" 2>&1`;
    const output = execSync(ffprobeCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    const ffmpegCmd = `ffmpeg -i "${filePath}" 2>&1 | head -20`;
    const ffmpegOutput = execSync(ffmpegCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).catch(() => '');

    const metadata = parseFfmpegMetadata(ffmpegOutput);
    return metadata.valid ? { ...validation, ...metadata } : { ...validation, ...metadata };
  } catch (error) {
    return { ...validation, valid: false, error: `Probe failed: ${error.message}` };
  }
};

module.exports = {
  parseFfmpegMetadata,
  validateVideoFile,
  probeVideoMetadata,
};
