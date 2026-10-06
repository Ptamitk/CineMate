const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildAdaptiveSamplingPlan = ({
  durationSeconds = 0,
  requestedInterval = 1.5,
  requestedMaxFrames = 48,
  requestedOcrFrames = 8,
} = {}) => {
  const duration = Number(durationSeconds) || 0;
  let strategy = 'coarse';
  let interval = Number(requestedInterval) || 1.5;

  if (duration <= 8) {
    strategy = 'dense';
    interval = Math.max(0.2, Math.min(0.9, duration / 20));
  } else if (duration <= 30) {
    strategy = 'balanced';
    interval = Math.max(0.5, Math.min(1.5, duration / 28));
  } else if (duration <= 120) {
    strategy = 'coarse';
    interval = Math.max(0.75, Math.min(2.5, duration / 42));
  } else {
    strategy = 'coarse';
    interval = Math.max(1.25, Math.min(4, duration / 60));
  }

  const maxFrames = clamp(Number(requestedMaxFrames) || 48, 12, 96);
  const targetFrames = clamp(
    Math.max(12, Math.ceil(duration / interval)),
    12,
    maxFrames
  );

  const ocrFrameCount = clamp(Number(requestedOcrFrames) || 8, 3, Math.min(12, targetFrames));
  const targetRepresentativeFrames = clamp(
    Math.max(ocrFrameCount, Math.min(targetFrames, 14)),
    ocrFrameCount,
    targetFrames
  );

  return {
    strategy,
    intervalSeconds: Number(interval.toFixed(3)),
    targetFrames,
    ocrFrameCount,
    targetRepresentativeFrames,
  };
};

const pickRepresentativeFrames = ({
  frameFiles = [],
  durationSeconds = 0,
  targetCount = 12,
  strategy = 'balanced',
} = {}) => {
  if (!Array.isArray(frameFiles) || frameFiles.length === 0) {
    return [];
  }

  const limit = clamp(Number(targetCount) || 12, 1, frameFiles.length);
  const duration = Number(durationSeconds) || 0;
  const selected = [];
  const spacing = Math.max(1, Math.ceil(frameFiles.length / limit));

  for (let index = 0; index < frameFiles.length; index += spacing) {
    const framePath = frameFiles[index];
    if (!framePath) continue;

    const frameIndex = index;
    const timestamp = frameFiles.length > 1
      ? (frameIndex / (frameFiles.length - 1)) * duration
      : 0;

    const distributionBias = strategy === 'dense'
      ? 0.9
      : strategy === 'coarse'
        ? 0.6
        : 0.75;

    const sceneId = Math.min(12, Math.max(0, Math.floor((frameIndex / Math.max(1, frameFiles.length)) * 12)));
    const shotId = `${sceneId}-${Math.floor(frameIndex / Math.max(1, spacing))}`;
    const qualityScore = clamp(
      Number((distributionBias + (1 - Math.abs((frameIndex / Math.max(1, frameFiles.length)) - 0.5) * 1.2)).toFixed(3)),
      0,
      1
    );

    selected.push({
      framePath,
      frameIndex,
      timestamp: Number(timestamp.toFixed(3)),
      qualityScore,
      sceneId,
      shotId,
    });
  }

  return selected.length > limit ? selected.slice(0, limit) : selected;
};

module.exports = {
  buildAdaptiveSamplingPlan,
  pickRepresentativeFrames,
  clamp,
};
