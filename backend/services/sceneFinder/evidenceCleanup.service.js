const PROMO_PATTERNS = [
  /only in theaters?/gi, /now playing/gi, /coming soon/gi, /opening night/gi,
  /audience reaction/gi, /exclusive look/gi, /official trailer/gi, /watch now/gi,
  /buy tickets?/gi, /tickets? (available|on sale)/gi, /in theaters? (now|soon)/gi,
  /subscribe/gi, /follow (us|for)/gi, /like (and|\\&)? share/gi, /tag (your|a|me)/gi,
  /\\b\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}\\b/g,
];
const SOCIAL_WORDS = /\\b(fyp|viral|reels?|instagram|explore|trending|subscribe|follow|share|comment|like)\\b/gi;
const normalize = (value = "") => String(value).normalize("NFKC")
  .replace(/[^\\p{L}\\p{N}\\s:'&!?-]/gu, " ").replace(/\\s+/g, " ").trim();
const cleanText = (value = "") => {
  let text = normalize(value);
  for (const pattern of PROMO_PATTERNS) text = text.replace(pattern, " ");
  return normalize(text.replace(SOCIAL_WORDS, " "));
};
const tokens = (value = "") => new Set(cleanText(value).toLowerCase().split(/\\s+/).filter(t => t.length >= 2));
const overlapScore = (source, title, originalTitle = "") => {
  const sourceTokens = tokens(source); if (!sourceTokens.size) return 0;
  return Math.max(...[title, originalTitle].map(name => {
    const titleTokens = tokens(name); if (!titleTokens.size) return 0;
    const overlap = [...titleTokens].filter(t => sourceTokens.has(t)).length;
    const recall = overlap / titleTokens.size, precision = overlap / sourceTokens.size;
    if (recall === 1 && titleTokens.size >= 2) return 0.94;
    if (titleTokens.size === 1 && overlap === 1 && sourceTokens.size <= 4) return 0.86;
    return precision * 0.35 + recall * 0.65;
  }));
};
const exactTitle = (source, title, originalTitle = "") => {
  const cleaned = cleanText(source).toLowerCase();
  return [title, originalTitle].map(cleanText).filter(Boolean).some(n => cleaned === n.toLowerCase());
};
const extractTextEvidence = ({ caption = "", ocrResults = [], speech = "" }) => {
  const rows = Array.isArray(ocrResults) ? ocrResults : [];
  const cleanOcrRows = rows.map(row => ({ ...row, cleanedText: cleanText(row.text || "") })).filter(row => row.cleanedText);
  const counts = new Map();
  for (const row of cleanOcrRows) {
    const key = row.cleanedText.toLowerCase();
    const item = counts.get(key) || { text: row.cleanedText, count: 0, confidence: 0 };
    item.count += 1; item.confidence = Math.max(item.confidence, Number(row.confidence || 0)); counts.set(key, item);
  }
  return {
    caption: cleanText(caption),
    ocr: cleanOcrRows.map(r => r.cleanedText).join("\\n"),
    stableOcr: [...counts.values()].filter(x => x.count >= 2).map(x => x.text).join("\\n"),
    speech: cleanText(speech), ocrRows: cleanOcrRows,
  };
};
module.exports = { cleanText, tokens, overlapScore, exactTitle, extractTextEvidence };
