const cleanOcrText = (rawText = '') => {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = String(rawText)
    .normalize('NFKC')
    .replace(/[@#][\p{L}\p{N}_-]+/gu, '')
    .replace(/\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|share|comment|like|tag|watch|don't forget|save this)\b/gi, '')
    .replace(/\b(?:follow us|tag someone|comment below|subscribe now|hit like|share this)\b/gi, '')
    .replace(/[©®™℠]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 4 || text.length > 120) return '';

  return text;
};

const filterRepeatedFragments = (texts = []) => {
  if (!Array.isArray(texts)) return [];

  const clean = texts
    .map((t) => cleanOcrText(t))
    .filter(Boolean);

  const seen = new Map();
  const result = [];

  clean.forEach((text) => {
    const lower = text.toLowerCase();
    const count = (seen.get(lower) || 0) + 1;
    seen.set(lower, count);

    if (count <= 3 && text.length >= 4) {
      result.push(text);
    }
  });

  return result;
};

const normalizeOcrResults = (ocrFrames = []) => {
  if (!Array.isArray(ocrFrames)) return [];

  return ocrFrames
    .map((frame) => ({
      ...frame,
      text: cleanOcrText(frame?.text ?? ''),
      confidence: Number(frame?.confidence ?? 0),
    }))
    .filter((frame) => frame.text && frame.confidence >= 0.3);
};

const cleanSpeechTranscript = (rawText = '') => {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = String(rawText)
    .normalize('NFKC')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(?:um|uh|uhh|err|uh huh|yeah|yep|nope|uh-huh|hmm|hmph)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 4 || text.length > 180) return '';

  return text;
};

const buildEvidenceConsensus = ({
  ocrFrames = [],
  speechTranscript = '',
  minOcrAgreement = 2,
} = {}) => {
  const normalized = normalizeOcrResults(ocrFrames);
  const cleaned = cleanSpeechTranscript(speechTranscript);

  const ocrCandidates = new Map();
  normalized.forEach((frame) => {
    const text = frame.text.toLowerCase();
    ocrCandidates.set(text, (ocrCandidates.get(text) || 0) + 1);
  });

  const strongOcr = Array.from(ocrCandidates.entries())
    .filter(([, count]) => count >= minOcrAgreement)
    .map(([text]) => text)
    .slice(0, 5);

  return {
    ocrConsensus: strongOcr,
    speechText: cleaned,
    ocrAgreementLevel: Math.max(...Array.from(ocrCandidates.values()), 0),
  };
};

module.exports = {
  cleanOcrText,
  filterRepeatedFragments,
  normalizeOcrResults,
  cleanSpeechTranscript,
  buildEvidenceConsensus,
};
