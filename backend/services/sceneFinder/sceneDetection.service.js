const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeFrameMetrics = (frame = {}) => ({
  brightness: Number(frame.brightness ?? 0.5),
  contrast: Number(frame.contrast ?? 0.5),
  duplicateRatio: Number(frame.duplicateRatio ?? 0),
  qualityScore: Number(frame.qualityScore ?? 0.5),
  isDark: Boolean(frame.isDark),
  isTransition: Boolean(frame.isTransition),
  isTextHeavy: Boolean(frame.isTextHeavy),
  isSocialUi: Boolean(frame.isSocialUi),
  framePath: frame.framePath || null,
  timestamp: Number(frame.timestamp ?? 0),
});

const calculateVisualDelta = (previousFrame = {}, nextFrame = {}) => {
  const left = normalizeFrameMetrics(previousFrame);
  const right = normalizeFrameMetrics(nextFrame);

  const brightnessDelta = Math.abs(left.brightness - right.brightness);
  const contrastDelta = Math.abs(left.contrast - right.contrast);
  const duplicateDelta = Math.abs(left.duplicateRatio - right.duplicateRatio);
  const qualityDelta = Math.abs(left.qualityScore - right.qualityScore);

  const score =
    brightnessDelta * 0.32 +
    contrastDelta * 0.28 +
    duplicateDelta * 0.2 +
    qualityDelta * 0.2;

  return clamp(Number(score.toFixed(3)), 0, 1);
};

const detectSceneBoundaries = ({ frames = [], threshold = 0.24 } = {}) => {
  if (!Array.isArray(frames) || frames.length === 0) {
    return [];
  }

  const scenes = [];
  let currentStart = 0;

  for (let index = 1; index < frames.length; index += 1) {
    const previous = normalizeFrameMetrics(frames[index - 1]);
    const current = normalizeFrameMetrics(frames[index]);
    const delta = calculateVisualDelta(previous, current);

    if (delta >= threshold || current.isTransition || current.isDark) {
      scenes.push({
        startIndex: currentStart,
        endIndex: index - 1,
        sceneId: scenes.length,
        boundaryStrength: Number(delta.toFixed(3)),
      });
      currentStart = index;
    }
  }

  scenes.push({
    startIndex: currentStart,
    endIndex: frames.length - 1,
    sceneId: scenes.length,
    boundaryStrength: 0,
  });

  return scenes.filter((scene) => scene.endIndex >= scene.startIndex);
};

const selectSceneRepresentatives = ({
  frames = [],
  maxRepresentatives = 6,
  threshold = 0.24,
} = {}) => {
  const scenes = detectSceneBoundaries({ frames, threshold });

  if (!scenes.length) {
    return [];
  }

  const representatives = scenes
    .map((scene) => {
      const slice = frames.slice(scene.startIndex, scene.endIndex + 1);
      const best = slice
        .map((frame, offset) => ({
          frame,
          frameIndex: scene.startIndex + offset,
          score: Number((Number(frame.qualityScore ?? 0.5) + (1 - Math.abs(scene.startIndex + offset - (scene.startIndex + scene.endIndex) / 2) / Math.max(1, slice.length))).toFixed(3)),
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

      return {
        sceneId: scene.sceneId,
        startIndex: scene.startIndex,
        endIndex: scene.endIndex,
        representative: best ? best.frame : slice[0],
        representativeIndex: best ? best.frameIndex : scene.startIndex,
      };
    })
    .filter((scene) => scene.representative)
    .slice(0, maxRepresentatives);

  return representatives;
};

module.exports = {
  calculateVisualDelta,
  detectSceneBoundaries,
  selectSceneRepresentatives,
};
