const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isDialogueLike,
  isTitleCandidate,
  shouldRejectSpeechOnlyMatch,
  shouldRejectWeakCandidate,
} = require('../services/sceneFinder/sceneDecisionGuard.service');

const {
  buildAdaptiveSamplingPlan,
  pickRepresentativeFrames,
} = require('../services/sceneFinder/adaptiveFrameSampler.service');

const {
  estimateFrameQuality,
  filterHighQualityFrames,
} = require('../services/sceneFinder/frameQuality.service');

const {
  detectSceneBoundaries,
  selectSceneRepresentatives,
} = require('../services/sceneFinder/sceneDetection.service');

const {
  cleanOcrText,
  buildEvidenceConsensus,
} = require('../services/sceneFinder/evidenceCleanup.service');

const {
  buildConfidenceModel,
  shouldAcceptMatch,
  shouldRejectWeakMatch,
} = require('../services/sceneFinder/confidenceGate.service');

const {
  fuseEvidenceLayers,
  calculateCandidateMargin,
} = require('../services/sceneFinder/evidenceFusion.service');

test('dialogue-only sentence is rejected as a title candidate', () => {
  assert.equal(isTitleCandidate('What\'s wrong with you?'), false);
  assert.equal(isDialogueLike('What\'s wrong with you?'), true);
});

test('title-like text remains valid for retrieval', () => {
  assert.equal(isTitleCandidate('The Dark Knight'), true);
  assert.equal(isTitleCandidate('Movie: The Dark Knight'), false);
});

test('speech-only output is rejected when visual evidence is weak', () => {
  const rejection = shouldRejectSpeechOnlyMatch({
    bestMatch: { evidenceType: 'text-corroborated', title: 'What\'s wrong with you?' },
    evidence: { visualLabelScore: 0.1, artworkAverage: 0.12 },
    speechText: 'What\'s wrong with you?',
  });

  assert.equal(rejection, true);
});

test('adaptive frame strategy scales to short and long clips', () => {
  const shortPlan = buildAdaptiveSamplingPlan({
    durationSeconds: 6,
    requestedInterval: 1.5,
    requestedMaxFrames: 32,
  });
  const longPlan = buildAdaptiveSamplingPlan({
    durationSeconds: 180,
    requestedInterval: 1.5,
    requestedMaxFrames: 48,
  });

  assert.equal(shortPlan.strategy, 'dense');
  assert.equal(longPlan.strategy, 'coarse');
  assert.ok(shortPlan.targetFrames >= 12);
  assert.ok(longPlan.targetFrames <= 48);
});

test('representative frames keep temporal metadata and quality scores', () => {
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
    strategy: 'balanced',
  });

  assert.equal(picked.length, 8);
  assert.equal(typeof picked[0].timestamp, 'number');
  assert.equal(typeof picked[0].qualityScore, 'number');
  assert.equal(typeof picked[0].sceneId, 'number');
});

test('frame quality filter rejects low-value frames', () => {
  const filtered = filterHighQualityFrames([
    { brightness: 0.1, contrast: 0.2, duplicateRatio: 0.97, isDark: true, isTransition: true },
    { brightness: 0.7, contrast: 0.8, duplicateRatio: 0.02, isDark: false, isTransition: false },
  ]);

  assert.equal(filtered.length, 1);
  assert.ok(filtered[0].qualityScore >= 0.25);
  assert.ok(estimateFrameQuality({ brightness: 0.7, contrast: 0.8 }) > 0.5);
});

test('scene detection identifies distinct visual regions', () => {
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

test('OCR text cleanup removes social media noise', () => {
  const dirty = '@user #viral Watch till end! Follow us!';
  const clean = cleanOcrText(dirty);

  assert.equal(clean, '');
});

test('OCR text cleanup preserves valid titles', () => {
  const title = 'The Dark Knight Rises';
  const clean = cleanOcrText(title);

  assert.equal(clean, title);
});

test('evidence consensus requires repeated OCR agreement', () => {
  const consensus = buildEvidenceConsensus({
    ocrFrames: [
      { text: 'The Dark Knight', confidence: 0.9 },
      { text: 'The Dark Knight', confidence: 0.85 },
      { text: 'Random Noise', confidence: 0.5 },
    ],
    speechTranscript: '',
    minOcrAgreement: 2,
  });

  assert.equal(consensus.ocrConsensus.length, 1);
  assert.equal(consensus.ocrConsensus[0], 'the dark knight');
});

test('confidence model rejects weak-only matches', () => {
  const model = buildConfidenceModel({
    visualScore: 0.3,
    artworkScore: 0.2,
    ocrAgreement: 0.1,
    speechSupport: 0.15,
  });

  const shouldReject = shouldRejectWeakMatch({
    finalConfidence: model.finalConfidence,
    visualScore: 0.3,
    artworkScore: 0.2,
    hasDialogueOnly: false,
  });

  assert.equal(shouldReject, true);
});

test('confidence model requires multiple independent signals', () => {
  const model = buildConfidenceModel({
    visualScore: 0.9,
    artworkScore: 0.05,
    ocrAgreement: 0.05,
    speechSupport: 0,
  });

  const shouldAccept = shouldAcceptMatch({
    finalConfidence: model.finalConfidence,
    independentSignals: model.independentSignals,
    candidateMargin: 0.3,
    hasDialogueOnly: false,
    hasConflictingEvidence: false,
  });

  assert.equal(shouldAccept, false);
});

test('evidence fusion combines multiple signal types', () => {
  const fused = fuseEvidenceLayers({
    visualMatches: [
      { movieId: 1, title: 'The Dark Knight', type: 'movie', score: 0.85 },
      { movieId: 1, title: 'The Dark Knight', type: 'movie', score: 0.82 },
    ],
    ocrCandidates: [
      { movieId: 1, title: 'The Dark Knight', type: 'movie', score: 0.75 },
    ],
    artworkMatches: [
      { movieId: 1, title: 'The Dark Knight', type: 'movie', score: 0.88 },
    ],
  });

  assert.ok(fused.length > 0);
  assert.equal(fused[0].id, 1);
  assert.ok(fused[0].uniqueLayers >= 2);
});

test('candidate margin calculation identifies close matches', () => {
  const ranked = [
    { id: 1, title: 'Movie A', compositeScore: 0.68 },
    { id: 2, title: 'Movie B', compositeScore: 0.65 },
    { id: 3, title: 'Movie C', compositeScore: 0.58 },
  ];

  const margin = calculateCandidateMargin(ranked);
  assert.ok(margin > 0);
  assert.ok(margin < 0.15);
});

test('weak candidate with tiny margin is rejected', () => {
  const model = buildConfidenceModel({
    visualScore: 0.72,
    artworkScore: 0.65,
    ocrAgreement: 0.0,
    speechSupport: 0.0,
  });

  const shouldAccept = shouldAcceptMatch({
    finalConfidence: model.finalConfidence,
    independentSignals: model.independentSignals,
    candidateMargin: 0.08,
    hasDialogueOnly: false,
    hasConflictingEvidence: false,
  });

  assert.equal(shouldAccept, false);
});
