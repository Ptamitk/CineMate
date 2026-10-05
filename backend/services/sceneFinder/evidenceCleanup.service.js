const PROMO_PATTERNS = [
  /only in theaters?/gi,/now playing/gi,/coming soon/gi,/opening night/gi,/audience reaction/gi,
  /exclusive look/gi,/official trailer/gi,/watch now/gi,/buy tickets?/gi,/tickets? (available|on sale)/gi,
  /in theaters? (now|soon)/gi,/subscribe/gi,/follow (us|for)/gi,/like (and|&)? share/gi,/tag (your|a|me)/gi,
  /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g,/relive the experience/gi,
];
const SOCIAL_WORDS = /\b(fyp|viral|reels?|instagram|explore|trending|subscribe|follow|share|comment|like|tag)\b/gi;
const normalize = value => String(value || "").normalize("NFKC").replace(/[^\p{L}\p{N}\s:'&!?-]/gu," ").replace(/\s+/g," ").trim();
const cleanText = value => {
  let text = normalize(value);
  for (const pattern of PROMO_PATTERNS) text = text.replace(pattern," ");
  return normalize(text.replace(SOCIAL_WORDS," "));
};
const TITLE_STOPWORDS = new Set([
  "a","an","the","and","or","of","to","in","on","at","for","from","with",
  "is","my","your","our","his","her","their","this","that","it","me","you"
]);

const tokens = value => new Set(
  cleanText(value).toLowerCase().split(/\s+/)
    .filter(t => t.length >= 2 && !TITLE_STOPWORDS.has(t))
);
const overlapScore = (source,title,originalTitle="") => {
  const sourceTokens=tokens(source); if(!sourceTokens.size)return 0;
  return Math.max(...[title,originalTitle].map(name=>{
    const titleTokens=tokens(name); if(!titleTokens.size)return 0;
    const overlap=[...titleTokens].filter(t=>sourceTokens.has(t)).length;
    const recall=overlap/titleTokens.size, precision=overlap/sourceTokens.size;
    if (titleTokens.size >= 2 && recall === 1) return 0.94;
    if (titleTokens.size === 1 && overlap === 1 && sourceTokens.size <= 4) return 0.86;
    return precision*0.35+recall*0.65;
  }));
};
const exactTitle = (source,title,originalTitle="") => {
  const cleaned=cleanText(source).toLowerCase();
  return [title,originalTitle].map(cleanText).filter(Boolean).some(n=>cleaned===n.toLowerCase());
};
const extractTextEvidence = ({caption="",ocrResults=[],speech=""}) => {
  const rows=Array.isArray(ocrResults)?ocrResults:[];
  const cleanOcrRows=rows.map((row,index)=>({...row,index,cleanedText:cleanText(row.text||"")})).filter(row=>row.cleanedText);
  const counts=new Map();
  for(const row of cleanOcrRows){
    const key=row.cleanedText.toLowerCase();
    const item=counts.get(key)||{text:row.cleanedText,count:0,confidence:0,frames:[]};
    item.count++; item.confidence=Math.max(item.confidence,Number(row.confidence||0)); item.frames.push(row.index); counts.set(key,item);
  }
  const stableRows=[...counts.values()].filter(x=>x.count>=2).sort((a,b)=>b.count-a.count);

  // OCR engines often change one character or split a movie title differently
  // between frames. Exact-row repetition alone therefore misses real titles.
  // Build short n-gram consensus across DISTINCT frames so "Harry Potter" can
  // survive OCR variation without trusting a single noisy frame.
  const phraseStats = new Map();
  for (const row of cleanOcrRows) {
    const words = row.cleanedText.toLowerCase().split(/\s+/).filter(Boolean);
    const seen = new Set();
    for (let size = 2; size <= Math.min(5, words.length); size += 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const phrase = words.slice(start, start + size).join(" ");
        if (phrase.length < 4 || seen.has(phrase)) continue;
        seen.add(phrase);
        const item = phraseStats.get(phrase) || { text: phrase, frames: new Set(), confidence: 0 };
        item.frames.add(row.index);
        item.confidence = Math.max(item.confidence, Number(row.confidence || 0));
        phraseStats.set(phrase, item);
      }
    }
  }

  const stablePhrases = [...phraseStats.values()]
    .filter(item => item.frames.size >= 2)
    .sort((a, b) => b.frames.size - a.frames.size || b.text.length - a.text.length)
    .slice(0, 30)
    .map(item => item.text);

  const stableOcrParts = [
    ...stableRows.map(x => x.text),
    ...stablePhrases
  ];

  return {
    caption:cleanText(caption),
    ocr:cleanOcrRows.map(r=>r.cleanedText).join("\n"),
    stableOcr:[...new Set(stableOcrParts)].join("\n"),
    stableOcrRows:stableRows,
    stableOcrPhrases:stablePhrases,
    speech:cleanText(speech),
    ocrRows:cleanOcrRows,
  };
};
module.exports={cleanText,tokens,overlapScore,exactTitle,extractTextEvidence};
