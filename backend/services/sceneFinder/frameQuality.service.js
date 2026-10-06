const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const estimateFrameQuality = ({
  brightness = 0.5,
  contrast = 0.5,
  duplicateRatio = 0,
  isTextHeavy = false,
  isDark = false,
  isTransition = false,
  isSocialUi = false,
} = {}) => {
  let score = 0.5;

  if (Number.isFinite(brightness)) {
    score += (brightness - 0.5) * 0.4;
  }

  if (Number.isFinite(contrast)) {
    score += (contrast - 0.5) * 0.3;
  }

  if (duplicateRatio > 0.75) score -= 0.35;
  if (duplicateRatio > 0.9) score -= 0.2;

  if (isDark) score -= 0.2;
  if (isTransition) score -= 0.25;
  if (isTextHeavy) score -= 0.15;
  if (isSocialUi) score -= 0.3;

  return clamp(Number(score.toFixed(3)), 0, 1);
};

const filterHighQualityFrames = (frames = []) => {
  if (!Array.isArray(frames)) return [];

  return frames
    .map((frame) => {
      const quality = estimateFrameQuality({
        brightness: frame?.brightness ?? 0.52,
        contrast: frame?.contrast ?? 0.55,
        duplicateRatio: frame?.duplicateRatio ?? 0,
        isTextHeavy: Boolean(frame?.isTextHeavy),
        isDark: Boolean(frame?.isDark),
        isTransition: Boolean(frame?.isTransition),
        isSocialUi: Boolean(frame?.isSocialUi),
      });

      return {
        ...frame,
        qualityScore: quality,
      };
    })
    .filter((frame) => (frame?.qualityScore ?? 0) >= 0.25)
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
};

module.exports = {
  clamp,
  estimateFrameQuality,
  filterHighQualityFrames,
};
