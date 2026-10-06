const DIALOGUE_PATTERNS = [
  /\b(?:what's wrong|what are you|who are you|where are you|why are you|how are you|i don't know|i've seen|what do you|you know|come on|please stop|look at me|why do you|what happened|where did|who did|how did|can you help|do you know|are you okay)\b/i,
  /^(?:what|why|who|how|where|when|which|i|you|we|they|he|she|do|did|does|are|is|can|could|would|will|please|look|listen|hello|hi)\b/i,
];

const SOCIAL_PATTERNS = [
  /\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|share|comment|like|tag|dont forget|save this|watch till end|for you page)\b/i,
  /(?:@\w+|#\w+)/,
];

const TITLE_PREFIX_REJECTS = [
  /^movie\b/i,
  /^film\b/i,
  /^show\b/i,
  /^series\b/i,
  /^season\b/i,
  /^episode\b/i,
  /^trailer\b/i,
  /^official\b/i,
  /^watch\b/i,
  /^story\b/i,
  /^plot\b/i,
  /^viral\b/i,
  /^reels?\b/i,
];

const cleanSignal = (value = '') => {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[@#][\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|share|comment|like|tag|watch till end|save this|dont forget)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isDialogueLike = (value = '') => {
  const text = cleanSignal(value);
  if (!text || text.length > 180) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return false;

  const lower = text.toLowerCase();
  const dialogueHit = DIALOGUE_PATTERNS.some((pattern) => pattern.test(lower));
  const startsLikeDialogue =
    words.length <= 12 &&
    /^(what|why|who|how|where|when|which|i|you|we|they|he|she|do|did|does|are|is|can|could|would|will|please|look|listen|hello|hi)\b/i.test(words[0]);

  return dialogueHit || startsLikeDialogue;
};

const isTitleCandidate = (value = '') => {
  const text = cleanSignal(value);
  if (!text || text.length < 4 || text.length > 100) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 8) return false;

  if (SOCIAL_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (isDialogueLike(text)) return false;
  if (TITLE_PREFIX_REJECTS.some((pattern) => pattern.test(text))) return false;
  if (/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(text)) return false;

  return true;
};

const hasStrongVisualSupport = (evidence = {}) => {
  const visual = Number(evidence?.visualLabelScore ?? 0);
  const artwork = Number(evidence?.artworkAverage ?? 0);
  const scene = Number(evidence?.sceneAgreement ?? 0);

  return visual >= 0.45 || artwork >= 0.45 || scene >= 0.45;
};

const shouldRejectSpeechOnlyMatch = ({ bestMatch, evidence, speechText = '' } = {}) => {
  if (!bestMatch || !bestMatch.evidenceType) return false;

  const textEvidence = ['text-corroborated', 'text-exact'].includes(bestMatch.evidenceType);
  if (!textEvidence) return false;

  if (!speechText || !isDialogueLike(speechText)) return false;

  return !hasStrongVisualSupport(evidence);
};

const shouldRejectWeakCandidate = ({
  score = 0,
  visualScore = 0,
  artworkAverage = 0,
  evidenceText = '',
  speechText = '',
} = {}) => {
  const normalizedScore = Number(score || 0);
  const visual = Number(visualScore || 0);
  const artwork = Number(artworkAverage || 0);

  if (normalizedScore >= 0.7) return false;
  if (visual >= 0.45 || artwork >= 0.45) return false;
  if (speechText && isDialogueLike(speechText)) return true;
  if (evidenceText && isDialogueLike(evidenceText)) return true;

  return normalizedScore < 0.45;
};

module.exports = {
  cleanSignal,
  isDialogueLike,
  isTitleCandidate,
  shouldRejectSpeechOnlyMatch,
  shouldRejectWeakCandidate,
  hasStrongVisualSupport,
};
