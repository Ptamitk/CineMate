const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildConfidenceModel = ({
  visualScore = 0,
  artworkScore = 0,
  ocrAgreement = 0,
  speechSupport = 0,
  temporalConsistency = 0,
  candidateMargin = 0,
} = {}) => {
  const visual = clamp(Number(visualScore) || 0, 0, 1);
  const artwork = clamp(Number(artworkScore) || 0, 0, 1);
  const ocr = clamp(Number(ocrAgreement) || 0, 0, 1);
  const speech = clamp(Number(speechSupport) || 0, 0, 1);
  const temporal = clamp(Number(temporalConsistency) || 0, 0, 1);
  const margin = clamp(Number(candidateMargin) || 0, 0, 1);

  const weightedScore =
    visual * 0.35 +
    artwork * 0.25 +
    ocr * 0.2 +
    speech * 0.1 +
    temporal * 0.1;

  const independentSignals = (visual >= 0.45 ? 1 : 0) +
    (artwork >= 0.45 ? 1 : 0) +
    (ocr >= 0.45 ? 1 : 0);

  const marginPenalty = margin < 0.15 ? 0.3 : 0;
  const finalConfidence = clamp(
    Number((weightedScore - marginPenalty).toFixed(3)),
    0,
    1
  );

  return {
    visualScore: visual,
    artworkScore: artwork,
    ocrAgreement: ocr,
    speechSupport: speech,
    temporalConsistency: temporal,
    candidateMargin: margin,
    weightedScore: Number(weightedScore.toFixed(3)),
    independentSignals,
    marginPenalty: Number(marginPenalty.toFixed(3)),
    finalConfidence,
  };
};

const shouldAcceptMatch = ({
  finalConfidence = 0,
  independentSignals = 0,
  candidateMargin = 0,
  hasDialogueOnly = false,
  hasConflictingEvidence = false,
} = {}) => {
  const confidence = Number(finalConfidence) || 0;
  const signals = Number(independentSignals) || 0;
  const margin = Number(candidateMargin) || 0;

  if (confidence < 0.6) return false;
  if (signals < 2) return false;
  if (margin < 0.12) return false;
  if (hasDialogueOnly) return false;
  if (hasConflictingEvidence) return false;

  return true;
};

const shouldRejectWeakMatch = ({
  finalConfidence = 0,
  visualScore = 0,
  artworkScore = 0,
  hasDialogueOnly = false,
} = {}) => {
  const confidence = Number(finalConfidence) || 0;
  const visual = Number(visualScore) || 0;
  const artwork = Number(artworkScore) || 0;

  if (confidence < 0.45) return true;
  if (visual < 0.35 && artwork < 0.35) return true;
  if (hasDialogueOnly) return true;

  return false;
};

const buildNoMatchResponse = () => ({
  success: true,
  matched: false,
  title: null,
  type: null,
  confidence: 0,
  message: 'No confident movie or TV match was found.',
  evidence: null,
});

module.exports = {
  buildConfidenceModel,
  shouldAcceptMatch,
  shouldRejectWeakMatch,
  buildNoMatchResponse,
  clamp,
};
