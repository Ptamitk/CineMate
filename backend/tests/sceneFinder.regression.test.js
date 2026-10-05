const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isDialogueLike,
  isTitleCandidate,
  shouldRejectSpeechOnlyMatch,
} = require("../services/sceneFinder/sceneDecisionGuard.service");

const {
  parseFfmpegMetadata,
} = require("../services/sceneFinder/videoAnalysis.service");

const {
  buildAdaptiveSamplingPlan,
  pickRepresentativeFrames,
} = require("../services/sceneFinder/adaptiveFrameSampler.service");

const {
  estimateFrameQuality,
  filterHighQualityFrames,
} = require("../services/sceneFinder/frameQuality.service");

const {
  detectSceneBoundaries,
  selectSceneRepresentatives,
} = require("../services/sceneFinder/sceneDetection.service");

test("dialogue-only sentence is rejected as a title candidate", () => {
  assert.equal(isTitleCandidate("What's wrong with you?"), false);
  assert.equal(isDialogueLike("What's wrong with you?"), true);
});

test("title-like text remains valid for retrieval", () => {
  assert.equal(isTitleCandidate("The Dark Knight"), true);
  assert.equal(isTitleCandidate("Movie: The Dark Knight"), false);
});

test("speech-only output is rejected when visual evidence is weak", () => {
  const rejection = shouldRejectSpeechOnlyMatch({
    bestMatch: { evidenceType: "text-corroborated", title: "What’s wrong with you?" },
    evidence: { visualLabelScore: 0.1, artworkAverage: 0.12 },
    speechText: "What's wrong with you?",
  });

  assert.equal(rejection, true);
});

test("video metadata parser extracts visible file profile", () => {
  const parsed = parseFfmpegMetadata(`
    Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'clip.mp4':
    Metadata:
    major_brand: isom
    minor_version: 1
    Duration: 00:00:23.40, start: 0.000000, bitrate: 1732000
    Stream #0:0(eng): Video: h264 (High), yuv420p, 1280x720 [SAR 1:1 DAR 16:9], 29.97 fps, 29.97 tbr, 30k tbn
    Stream #0:1(eng): Audio: aac (LC), 48000 Hz, stereo
  `);

  assert.equal(parsed.valid, true);
  assert.equal(parsed.width, 1280);
  assert.equal(parsed.height, 720);
  assert.equal(parsed.aspectRatio, 1280 / 720);
  assert.equal(parsed.audioPresent, true);
});

test("adaptive frame strategy scales to short and long clips", () => {
  const shortPlan = buildAdaptiveSamplingPlan({ durationSeconds: 6, requestedInterval: 1.5, requestedMaxFrames: 32, requestedOcrFrames: 8 });
  const longPlan = buildAdaptiveSamplingPlan({ durationSeconds: 180, requestedInterval: 1.5, requestedMaxFrames: 48, requestedOcrFrames: 8 });

  assert.equal(shortPlan.strategy, "dense");
  assert.equal(longPlan.strategy, "coarse");
  assert.ok(shortPlan.targetFrames >= 12);
  assert.ok(longPlan.targetFrames <= 48);
});

test("representative frames keep temporal metadata and quality scores", () => {
  const frames = Array.from({ length: 40 }, (_, index) => ({
    framePath: `/tmp/frame-${index}.jpg`,
    brightness: 0.55,
    contrast: 0.6,
    duplicateRatio: 0.02,
    qualityScore: 0.7,
    timestamp: index,
  }));

  const picked = pickRepresentativeFrames({
    frameFiles: frames.map((frame) => frame.framePath),
    durationSeconds: 40,
    targetCount: 8,
    strategy: "balanced",
  });

  assert.equal(picked.length, 8);
  assert.equal(typeof picked[0].timestamp, "number");
  assert.equal(typeof picked[0].qualityScore, "number");
  assert.equal(typeof picked[0].sceneId, "number");
});

test("frame quality filter rejects low-value frames", () => {
  const filtered = filterHighQualityFrames([
    { brightness: 0.1, contrast: 0.2, duplicateRatio: 0.97, isDark: true, isTransition: true },
    { brightness: 0.7, contrast: 0.8, duplicateRatio: 0.02, isDark: false, isTransition: false },
  ]);

  assert.equal(filtered.length, 1);
  assert.ok(filtered[0].qualityScore >= 0.25);
  assert.ok(estimateFrameQuality({ brightness: 0.7, contrast: 0.8 }) > 0.5);
});

test("scene detection identifies distinct visual regions", () => {
  const frames = [
    { brightness: 0.5, contrast: 0.5, duplicateRatio: 0.01, qualityScore: 0.8 },
    { brightness: 0.52, contrast: 0.51, duplicateRatio: 0.02, qualityScore: 0.8 },
    { brightness: 0.54, contrast: 0.52, duplicateRatio: 0.03, qualityScore: 0.8 },
    { brightness: 0.15, contrast: 0.2, duplicateRatio: 0.02, qualityScore: 0.3, isDark: true },
    { brightness: 0.16, contrast: 0.18, duplicateRatio: 0.03, qualityScore: 0.3, isDark: true },
    { brightness: 0.9, contrast: 0.9, duplicateRatio: 0.01, qualityScore: 0.9 },
    { brightness: 0.91, contrast: 0.92, duplicateRatio: 0.02, qualityScore: 0.9 },
  ];

  const scenes = detectSceneBoundaries({ frames, threshold: 0.18 });
  const representatives = selectSceneRepresentatives({ frames, threshold: 0.18, maxRepresentatives: 4 });

  assert.ok(scenes.length >= 2);
  assert.ok(representatives.length >= 2);
});
