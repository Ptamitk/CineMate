const normalizeText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTitle = (value = "") =>
  normalizeText(value)
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeTitle(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);

const getYear = (date = "") => {
  const match = String(date).match(
    /\b(19\d{2}|20\d{2})\b/
  );

  return match ? Number(match[1]) : null;
};

const COMMON_SCENE_WORDS = new Set([
  "man", "woman", "boy", "girl", "person", "people",
  "love", "life", "time", "day", "night", "world",
  "home", "house", "family", "friend", "friends",
  "good", "bad", "best", "new", "old", "one", "two",
  "three", "place", "thing", "things", "way", "work",
  "story", "movie", "film", "show", "series", "scene",
]);

const isDistinctiveTitle = (value = "") => {
  const tokens = tokenize(value);

  if (tokens.length >= 2) {
    return true;
  }

  if (tokens.length !== 1) {
    return false;
  }

  const token = tokens[0];

  return (
    token.length >= 4 &&
    !COMMON_SCENE_WORDS.has(token)
  );
};

const areIndependentTextSignals = (
  firstSource = "",
  secondSource = ""
) => {
  const first = normalizeText(firstSource);
  const second = normalizeText(secondSource);

  if (!first || !second) {
    return false;
  }

  if (first === second) {
    return false;
  }

  const firstTokens = new Set(
    first.split(/\s+/).filter(Boolean)
  );
  const secondTokens = new Set(
    second.split(/\s+/).filter(Boolean)
  );

  const common = [...firstTokens].filter((token) =>
    secondTokens.has(token)
  ).length;

  const union = new Set([
    ...firstTokens,
    ...secondTokens,
  ]).size;

  const jaccard = union
    ? common / union
    : 0;

  if (jaccard >= 0.8) {
    return false;
  }

  const shorter = Math.min(
    first.length,
    second.length
  );
  const longer = Math.max(
    first.length,
    second.length
  );

  if (
    longer > 0 &&
    shorter / longer >= 0.8 &&
    (first.includes(second) || second.includes(first))
  ) {
    return false;
  }

  return true;
};

const PROMO_TITLE_PATTERNS = [
  /^only in theaters?$/i,
  /^now playing$/i,
  /^coming soon$/i,
  /^watch now$/i,
  /^official trailer$/i,
  /^official teaser$/i,
  /^new trailer$/i,
  /^new teaser$/i,
  /^full video$/i,
  /^full movie$/i,
  /^subscribe$/i,
  /^follow us$/i,
  /^link in bio$/i,
  /^click the link$/i,
  /^out now$/i,
  /^available now$/i,
];

const isPromotionalTitle = (value = "") => {
  const normalized = normalizeTitle(value);

  if (!normalized) {
    return true;
  }

  if (
    PROMO_TITLE_PATTERNS.some((pattern) =>
      pattern.test(normalized)
    )
  ) {
    return true;
  }

  const words = normalized.split(/\s+/);

  if (
    words.length <= 5 &&
    /^(only|now|new|official|watch|coming|out|available|full|latest|exclusive)$/.test(
      words[0]
    )
  ) {
    return true;
  }

  return false;
};

const getTitleSimilarity = (a = "", b = "") => {
  const first = normalizeTitle(a);
  const second = normalizeTitle(b);

  if (!first || !second) {
    return 0;
  }

  if (first === second) {
    return isDistinctiveTitle(first) ? 1 : 0;
  }

  if (
    first.includes(second) ||
    second.includes(first)
  ) {
    const shorter = Math.min(
      first.length,
      second.length
    );

    const longer = Math.max(
      first.length,
      second.length
    );

    if (shorter / longer >= 0.65) {
      return 0.9;
    }
  }

  const firstTokens = new Set(tokenize(first));
  const secondTokens = new Set(tokenize(second));

  if (
    !firstTokens.size ||
    !secondTokens.size
  ) {
    return 0;
  }

  let common = 0;

  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      common += 1;
    }
  }

  const union = new Set([
    ...firstTokens,
    ...secondTokens,
  ]).size;

  return union ? common / union : 0;
};

const getExactTitleScore = (
  source = "",
  candidate = ""
) => {
  const first = normalizeTitle(source);
  const second = normalizeTitle(candidate);

  if (!first || !second) {
    return 0;
  }

  return (
    first === second &&
    isDistinctiveTitle(second)
  )
    ? 1
    : 0;
};

const getWordOverlap = (
  source = "",
  candidate = ""
) => {
  const sourceTokens = new Set(tokenize(source));
  const candidateTokens = new Set(
    tokenize(candidate)
  );

  if (
    !sourceTokens.size ||
    !candidateTokens.size
  ) {
    return 0;
  }

  let matches = 0;

  for (const token of sourceTokens) {
    if (candidateTokens.has(token)) {
      matches += 1;
    }
  }

  return (
    matches /
    Math.max(
      sourceTokens.size,
      candidateTokens.size
    )
  );
};

const getTypeScore = (
  captionType = "",
  contentType = ""
) => {
  if (!captionType || !contentType) {
    return 0;
  }

  return captionType === contentType ? 1 : -0.4;
};

const getYearScore = (
  captionYear,
  candidateYear
) => {
  if (!captionYear || !candidateYear) {
    return 0;
  }

  return captionYear === candidateYear ? 1 : -1;
};

const getTextSignal = (
  sourceText = "",
  title = "",
  originalTitle = ""
) => {
  if (!sourceText) {
    return {
      similarity: 0,
      exact: 0,
      overlap: 0,
    };
  }

  const similarity = Math.max(
    getTitleSimilarity(sourceText, title),
    getTitleSimilarity(
      sourceText,
      originalTitle
    )
  );

  const exact = Math.max(
    getExactTitleScore(sourceText, title),
    getExactTitleScore(
      sourceText,
      originalTitle
    )
  );

  const overlap = Math.max(
    getWordOverlap(sourceText, title),
    getWordOverlap(
      sourceText,
      originalTitle
    )
  );

  return {
    similarity,
    exact,
    overlap,
  };
};

const getBestTextSignal = (
  text = "",
  title = "",
  originalTitle = ""
) => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return {
      similarity: 0,
      exact: 0,
      overlap: 0,
      source: "",
    };
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length >= 3 &&
        line.length <= 120
    );

  const sources = [
    ...lines,
  ];

  if (normalized.split(/\s+/).length <= 12) {
    sources.unshift(normalized);
  }

  const addWordWindows = (text) => {
    const words = text
      .split(/\s+/)
      .filter(Boolean);

    const windows = [];

    for (let size = 2; size <= Math.min(8, words.length); size += 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        windows.push(words.slice(start, start + size).join(" "));
      }
    }

    return windows;
  };

  sources.push(
    ...lines.flatMap(addWordWindows).slice(0, 80)
  );

  let best = {
    similarity: 0,
    exact: 0,
    overlap: 0,
    source: "",
  };

  for (const source of sources) {
    const signal = getTextSignal(
      source,
      title,
      originalTitle
    );

    if (
      signal.exact > best.exact ||
      (
        signal.exact === best.exact &&
        signal.similarity >
          best.similarity
      )
    ) {
      best = {
        ...signal,
        source,
      };
    }
  }

  return best;
};

const getVisualSignal = (
  visualSignals = [],
  visualRecognitionMatches = [],
  artworkSimilarityMatches = [],
  title = "",
  originalTitle = ""
) => {
  let bestSimilarity = 0;
  let bestOverlap = 0;

  if (Array.isArray(visualSignals)) {
    for (const item of visualSignals) {
      const description =
        typeof item === "string"
          ? item
          : item?.description || "";

      if (!description) {
        continue;
      }

      const signal = getTextSignal(
        description,
        title,
        originalTitle
      );

      bestSimilarity = Math.max(
        bestSimilarity,
        signal.similarity
      );

      bestOverlap = Math.max(
        bestOverlap,
        signal.overlap
      );
    }
  }

  let clipAverage = 0;
  let clipMax = 0;
  let clipMargin = 0;
  let clipFramesMatched = 0;

  if (Array.isArray(visualRecognitionMatches)) {
    const titleSet = new Set([
      normalizeTitle(title),
      normalizeTitle(originalTitle),
    ].filter(Boolean));

    const matched = visualRecognitionMatches.find(
      (item) =>
        titleSet.has(
          normalizeTitle(item?.label || "")
        )
    );

    if (matched) {
      clipAverage = Math.max(
        Number(
          matched.averageScore || 0
        ),
        Number(
          matched.relativeAverageScore || 0
        )
      );

      clipMax = Math.max(
        Number(
          matched.maxScore || 0
        ),
        Number(
          matched.relativeMaxScore || 0
        )
      );

      clipFramesMatched = Number(
        matched.topFrameCount || 0
      );

      const competitors =
        visualRecognitionMatches
          .filter(
            (item) =>
              !titleSet.has(
                normalizeTitle(item?.label || "")
              )
          )
          .map((item) =>
            Math.max(
              Number(
                item?.averageScore || 0
              ),
              Number(
                item?.relativeAverageScore || 0
              )
            )
          );

      const bestCompetitor =
        competitors.length
          ? Math.max(...competitors)
          : 0;

      clipMargin = Math.max(
        0,
        clipAverage - bestCompetitor
      );
    }
  }

  let artworkAverage = 0;
  let artworkMax = 0;
  let artworkMargin = 0;
  let artworkFramesMatched = 0;

  if (Array.isArray(artworkSimilarityMatches)) {
    const titleSet = new Set([
      normalizeTitle(title),
      normalizeTitle(originalTitle),
    ].filter(Boolean));

    const matched = artworkSimilarityMatches.find(
      (item) =>
        titleSet.has(
          normalizeTitle(item?.label || "")
        )
    );

    if (matched) {
      artworkAverage = Number(
        matched.imageSimilarity || 0
      );
      artworkMax = Number(
        matched.imageMaxSimilarity || 0
      );
      artworkFramesMatched = Number(
        matched.imageFramesMatched || 0
      );

      const competitors =
        artworkSimilarityMatches
          .filter(
            (item) =>
              !titleSet.has(
                normalizeTitle(item?.label || "")
              )
          )
          .map((item) =>
            Number(
              item?.imageSimilarity || 0
            )
          );

      artworkMargin = Math.max(
        0,
        artworkAverage -
          (competitors.length
            ? Math.max(...competitors)
            : 0)
      );
    }
  }

  const clipSimilarity =
    clipAverage > 0 || clipMax > 0
      ? clipAverage * 0.7 + clipMax * 0.3
      : 0;

  const artworkSimilarity =
    artworkAverage > 0 || artworkMax > 0
      ? artworkAverage * 0.7 +
        artworkMax * 0.3
      : 0;

  return {
    similarity: Math.max(
      bestSimilarity,
      clipSimilarity,
      artworkSimilarity
    ),
    overlap: bestOverlap,
    clipAverage,
    clipMax,
    clipMargin,
    clipFramesMatched,
    artworkAverage,
    artworkMax,
    artworkMargin,
    artworkFramesMatched,
  };
};

const calculateCandidateScore = ({
  candidate,
  extractedCaptionTitle = "",
  captionYear = null,
  captionType = "",
  ocrText = "",
  speechText = "",
  visualSignals = [],
  visualRecognitionMatches = [],
  artworkSimilarityMatches = [],
}) => {
  const title = candidate.title || "";
  const originalTitle =
    candidate.originalTitle || "";

  const usableCaptionTitle =
    isPromotionalTitle(
      extractedCaptionTitle
    )
      ? ""
      : extractedCaptionTitle;

  const captionSignal = getTextSignal(
    usableCaptionTitle,
    title,
    originalTitle
  );

  const ocrSignal = getBestTextSignal(
    ocrText,
    title,
    originalTitle
  );

  const speechSignal = getBestTextSignal(
    speechText,
    title,
    originalTitle
  );

  const visualSignal = getVisualSignal(
    visualSignals,
    visualRecognitionMatches,
    artworkSimilarityMatches,
    title,
    originalTitle
  );

  const candidateYear = getYear(
    candidate.releaseDate
  );

  const yearScore = getYearScore(
    captionYear,
    candidateYear
  );

  const typeScore = getTypeScore(
    captionType,
    candidate.contentType
  );

  let finalScore;
  let evidenceType = "none";

  const strongEnoughCaption =
    usableCaptionTitle &&
    (
      captionSignal.exact === 1 ||
      (
        captionSignal.similarity >= 0.72 &&
        captionSignal.overlap >= 0.45
      )
    );

  if (
    strongEnoughCaption &&
    captionSignal.exact === 1
  ) {
    finalScore = 0.98;

    if (yearScore === 1) {
      finalScore += 0.01;
    }

    if (typeScore === 1) {
      finalScore += 0.01;
    }

    evidenceType = "caption-exact";
  } else if (strongEnoughCaption) {
    finalScore =
      captionSignal.similarity * 0.65 +
      captionSignal.overlap * 0.2 +
      Math.max(yearScore, 0) * 0.1 +
      Math.max(typeScore, 0) * 0.05;

    if (yearScore < 0) {
      finalScore -= 0.3;
    }

    if (typeScore < 0) {
      finalScore -= 0.25;
    }

    if (
      captionSignal.similarity < 0.72 ||
      captionSignal.overlap < 0.45
    ) {
      finalScore = Math.min(
        finalScore,
        0.49
      );
    }

    evidenceType = "caption";
  } else {
    const ocrScore =
      ocrSignal.similarity * 0.6 +
      ocrSignal.overlap * 0.25 +
      ocrSignal.exact * 0.15;

    const speechScore =
      speechSignal.similarity * 0.6 +
      speechSignal.overlap * 0.25 +
      speechSignal.exact * 0.15;

    const visualScore =
      visualSignal.similarity * 0.55 +
      visualSignal.overlap * 0.45;

    const hasStrongOcr =
      ocrSignal.exact === 1 ||
      (
        ocrSignal.similarity >= 0.78 &&
        ocrSignal.overlap >= 0.5
      );

    const hasStrongSpeech =
      speechSignal.exact === 1 ||
      (
        speechSignal.similarity >= 0.78 &&
        speechSignal.overlap >= 0.5
      );

    /*
     * Visual-only identification is deliberately conservative.
     * CLIP zero-shot title classification can produce a high score
     * simply because one title happens to be more compatible with
     * the supplied candidate set. Require repeated frame agreement
     * plus a meaningful average and margin before accepting it.
     */
    const hasStrongArtworkVisual =
      visualSignal.artworkAverage >= 0.55 &&
      visualSignal.artworkMax >= 0.65 &&
      visualSignal.artworkMargin >= 0.06 &&
      visualSignal.artworkFramesMatched >= 2;

    const hasStrongVisual =
      (
        visualSignal.clipAverage >= 0.34 &&
        visualSignal.clipMax >= 0.60 &&
        visualSignal.clipMargin >= 0.12 &&
        visualSignal.clipFramesMatched >= 3
      ) ||
      hasStrongArtworkVisual;

    finalScore =
      ocrScore * 0.5 +
      speechScore * 0.3 +
      visualScore * 0.2;

    if (yearScore === 1) {
      finalScore += 0.08;
    }

    if (typeScore === 1) {
      finalScore += 0.07;
    }

    const strongEvidenceCount =
      Number(hasStrongOcr) +
      Number(hasStrongSpeech) +
      Number(hasStrongVisual);

    const independentTextSignals =
      Number(
        hasStrongOcr &&
        (
          !hasStrongSpeech ||
          areIndependentTextSignals(
            ocrSignal.source,
            speechSignal.source
          )
        )
      ) +
      Number(hasStrongSpeech);

    if (strongEvidenceCount === 0) {
      finalScore = Math.min(
        finalScore,
        0.39
      );
    }

    if (
      independentTextSignals === 1 &&
      !(
        ocrSignal.exact === 1 ||
        speechSignal.exact === 1
      )
    ) {
      finalScore = Math.min(
        finalScore,
        0.58
      );
    }

    if (
      hasStrongOcr ||
      hasStrongSpeech
    ) {
      evidenceType =
        independentTextSignals >= 2
          ? "text-multi-signal"
          : "text";
    } else if (hasStrongVisual) {
      /*
       * CLIP is useful as a verifier, not as proof by itself.
       * Keep a bounded visual floor rather than turning a forced
       * top candidate into a high-confidence identification.
       */
      const visualConfidenceFloor =
        0.62 +
        Math.min(
          Math.max(
            visualSignal.clipMargin - 0.12,
            0
          ) * 0.4,
          0.08
        );

      finalScore = Math.max(
        finalScore,
        visualConfidenceFloor
      );

      evidenceType = "visual";
    }
  }

  finalScore = Math.max(
    0,
    Math.min(finalScore, 1)
  );

  return {
    title,
    contentType: candidate.contentType,
    extractedCaptionTitle,
    captionYear,
    captionType,
    captionTitleScore: Number(
      captionSignal.similarity.toFixed(4)
    ),
    ocrTitleScore: Number(
      ocrSignal.similarity.toFixed(4)
    ),
    speechTitleScore: Number(
      speechSignal.similarity.toFixed(4)
    ),
    visualTitleScore: Number(
      visualSignal.similarity.toFixed(4)
    ),
    captionTitleExact:
      captionSignal.exact,
    ocrExact: ocrSignal.exact,
    speechExact:
      speechSignal.exact,
    yearScore,
    typeScore,
    evidenceType,
    finalScore: Number(
      finalScore.toFixed(4)
    ),
  };
};

const isStrongCaptionMatch = (
  signal
) => {
  if (
    !signal.extractedCaptionTitle ||
    isPromotionalTitle(
      signal.extractedCaptionTitle
    )
  ) {
    return false;
  }

  if (
    signal.captionTitleExact === 1
  ) {
    return true;
  }

  return (
    signal.captionTitleScore >= 0.78 &&
    signal.finalScore >= 0.55 &&
    signal.yearScore >= 0 &&
    signal.typeScore >= 0
  );
};

const isStrongTextMatch = (
  signal
) => {
  if (
    signal.extractedCaptionTitle &&
    !isPromotionalTitle(
      signal.extractedCaptionTitle
    )
  ) {
    return false;
  }

  return (
    (
      signal.evidenceType === "text" ||
      signal.evidenceType === "text-multi-signal"
    ) &&
    signal.finalScore >= 0.62
  );
};

const isStrongVisualMatch = (
  signal
) => {
  if (
    signal.extractedCaptionTitle &&
    !isPromotionalTitle(
      signal.extractedCaptionTitle
    )
  ) {
    return false;
  }

  return (
    signal.evidenceType === "visual" &&
    signal.finalScore >= 0.62
  );
};

const matchSceneCandidates = ({
  candidates = [],
  extractedCaptionTitle = "",
  captionYear = null,
  captionType = "",
  ocrText = "",
  speechText = "",
  visualSignals = [],
  visualRecognitionMatches = [],
  artworkSimilarityMatches = [],
}) => {
  if (
    !Array.isArray(candidates) ||
    !candidates.length
  ) {
    console.log(
      "No scene candidates available."
    );

    return [];
  }

  const scoredCandidates =
    candidates
      .map((candidate) => {
        const signal =
          calculateCandidateScore({
            candidate,
            extractedCaptionTitle,
            captionYear,
            captionType,
            ocrText,
            speechText,
            visualSignals,
            visualRecognitionMatches,
          });

        console.log(
          "Candidate signal scores:",
          signal
        );

        return {
          candidate,
          signal,
        };
      })
      .sort((a, b) => {
        const scoreDifference =
          b.signal.finalScore -
          a.signal.finalScore;

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        const evidenceRank = (signal) => {
          if (
            signal.evidenceType === "caption-exact"
          ) {
            return 4;
          }

          if (
            signal.evidenceType === "text-multi-signal"
          ) {
            return 3;
          }

          if (
            signal.evidenceType === "text" ||
            signal.evidenceType === "caption"
          ) {
            return 2;
          }

          if (
            signal.evidenceType === "visual"
          ) {
            return 1;
          }

          return 0;
        };

        const evidenceDifference =
          evidenceRank(b.signal) -
          evidenceRank(a.signal);

        if (evidenceDifference !== 0) {
          return evidenceDifference;
        }

        return (
          Number(b.candidate.popularity || 0) -
          Number(a.candidate.popularity || 0)
        );
      });

  const best =
    scoredCandidates[0];

  if (!best) {
    return [];
  }

  if (
    isStrongCaptionMatch(
      best.signal
    )
  ) {
    return [
      {
        ...best.candidate,
        sceneScore:
          best.signal.finalScore,
        confidence: Math.round(
          best.signal.finalScore * 100
        ),
        evidenceType:
          best.signal.evidenceType,
      },
    ];
  }

  const strongCandidates =
    scoredCandidates.filter(
      ({ signal }) =>
        isStrongTextMatch(signal) ||
        isStrongVisualMatch(signal)
    );

  if (!strongCandidates.length) {
    console.log(
      "No scene candidates passed the minimum score."
    );

    return [];
  }

  const strongBest =
    strongCandidates[0];

  const second =
    strongCandidates[1];

  if (
    second &&
    strongBest.signal.finalScore -
      second.signal.finalScore <
      0.08
  ) {
    const sameTitle =
      normalizeTitle(
        strongBest.candidate.title
      ) ===
      normalizeTitle(
        second.candidate.title
      );

    const bestYear = getYear(
      strongBest.candidate.releaseDate
    );

    const secondYear = getYear(
      second.candidate.releaseDate
    );

    const sameYear =
      Boolean(bestYear) &&
      bestYear === secondYear;

    const sameType =
      Boolean(strongBest.candidate.contentType) &&
      strongBest.candidate.contentType ===
        second.candidate.contentType;

    if (!sameTitle || !sameYear || !sameType) {
      console.log(
        "Scene candidates too close to confidently select."
      );

      return [];
    }
  }

  return [
    {
      ...strongBest.candidate,
      sceneScore:
        strongBest.signal.finalScore,
      confidence: Math.round(
        strongBest.signal.finalScore * 100
      ),
      evidenceType:
        strongBest.signal.evidenceType,
    },
  ];
};

module.exports = {
  matchSceneCandidates,
  calculateCandidateScore,
  normalizeTitle,
};
