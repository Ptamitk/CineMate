const { runFFmpeg } = require("./ffmpeg.service");

const DIALOGUE_PATTERNS = [
  /\b(?:what's wrong|what are you|who are you|where are you|why are you|how are you|i don't know|i've seen|what do you|you know|come on|please stop|look at me)\b/i,
  /^(?:what|why|who|how|where|when|which|i|you|we|they|he|she|do|did|does|are|is|can|could|would|will|please|look|listen)\b/i,
];

const SOCIAL_PATTERNS = [
  /\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|share|comment|like|tag)\b/i,
  /(?:@\w+|#\w+)/,
];

const cleanSignal = (value = "") => {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[@#][\p{L}\p{N}_-]+/gu, " ")
    .replace(/\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|share|comment|like|tag)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const isDialogueLike = (value = "") => {
  const text = cleanSignal(value);
  if (!text || text.length > 180) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return false;

  const lower = text.toLowerCase();
  const dialogueHit = DIALOGUE_PATTERNS.some((pattern) => pattern.test(lower));
  const startsLikeDialogue = words.length <= 12 && /^(what|why|who|how|where|when|which|i|you|we|they|he|she|do|did|does|are|is|can|could|would|will|please|look|listen)\b/i.test(words[0]);

  return dialogueHit || startsLikeDialogue;
};

const isTitleCandidate = (value = "") => {
  const text = cleanSignal(value);
  if (!text || text.length < 4 || text.length > 100) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 8) return false;

  if (SOCIAL_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (isDialogueLike(text)) return false;
  if (/^(movie|film|show|series|season|episode|trailer|official|watch|story|plot)\b/i.test(text)) return false;
  if (/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(text)) return false;

  return true;
};

const shouldRejectSpeechOnlyMatch = ({ bestMatch, evidence, speechText = "" } = {}) => {
  if (!bestMatch || !bestMatch.evidenceType) return false;

  const textEvidence = ["text-corroborated", "text-exact"].includes(bestMatch.evidenceType);
  const weakVisual = Number(evidence?.visualLabelScore || 0) < 0.45 && Number(evidence?.artworkAverage || 0) < 0.45;

  return textEvidence && weakVisual && !!speechText && isDialogueLike(speechText);
};

module.exports = {
  cleanSignal,
  isDialogueLike,
  isTitleCandidate,
  shouldRejectSpeechOnlyMatch,
};
