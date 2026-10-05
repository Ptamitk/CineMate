const {
  analyzeSceneSignals,
} = require("./sceneSignals.service");
const {
  findSceneCandidates,
} = require("./sceneCandidate.service");
const {
  getCandidateArtwork,
} = require("./tmdbArtwork.service");
const {
  analyzeArtworkSimilarity,
} = require("./visualRecognition.service");
const {
  analyzeVisualFrames,
} = require("./visualAnalysis.service");
const {
  selectUsefulFrames,
} = require("./frameSelection.service");

const normalize = (value = "") =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\\p{L}\\p{N}\\s]/gu, " ")
    .replace(/\\s+/g, " ")
    .trim();

const tokens = (value = "") =>
  new Set(
    normalize(value)
      .split(" ")
      .filter((token) => token.length > 1)
  );

const textSimilarity = (source, title, originalTitle) => {
  const sourceTokens = tokens(source);
  if (!sourceTokens.size) return 0;

  return Math.max(
    ...[title, originalTitle].map((candidateTitle) => {
      const candidateTokens = tokens(candidateTitle);
      if (!candidateTokens.size) return 0;

      let overlap = 0;
      for (const token of sourceTokens) {
        if (candidateTokens.has(token)) overlap += 1;
      }

      return overlap / Math.max(sourceTokens.size, candidateTokens.size);
    })
  );
};

const scoreTextEvidence = (candidate, caption, ocr, speech) => {
  const title = candidate.title || "";
  const original = candidate.originalTitle || "";

  const captionScore = textSimilarity(caption, title, original);
  const ocrScore = textSimilarity(ocr, title, original);
  const speechScore = textSimilarity(speech, title, original);

  const exact =
    [caption, ocr, speech].some((text) => {
      const source = normalize(text);
      return source && [title, original].some(
        (name) => source === normalize(name)
      );
    });

  const strongest = Math.max(captionScore, ocrScore, speechScore);
  const independent =
    [ocrScore, speechScore].filter((score) => score >= 0.55).length;

  return {
    captionScore,
    ocrScore,
    speechScore,
    exact,
    independent,
    strongest,
  };
};

const aggregateArtwork = (matches, candidate) => {
  const normalizedTitle = normalize(candidate.title);
  const normalizedOriginal = normalize(candidate.originalTitle);

  const rows = matches.filter((item) => {
    const label = normalize(item.label);
    return label === normalizedTitle || label === normalizedOriginal;
  });

  if (!rows.length) {
    return {
      average: 0,
      max: 0,
      matchedFrames: 0,
      bestImage: "",
    };
  }

  const similarities = rows
    .map((item) => Number(item.imageSimilarity || 0))
    .sort((a, b) => b - a);

  return {
    average: similarities.slice(0, 3).reduce((sum, value) => sum + value, 0) /
      Math.min(3, similarities.length),
    max: Math.max(...similarities),
    matchedFrames: Math.max(
      ...rows.map((item) => Number(item.imageFramesMatched || 0))
    ),
    bestImage: rows[0]?.imageUrl || "",
  };
};

const analyzeSceneEvidence = async ({
  frameFiles = [],
  ocrFrameFiles = [],
  audioPath = null,
  caption = "",
}) => {
  const signals = await analyzeSceneSignals({
    frameFiles: ocrFrameFiles.length ? ocrFrameFiles : frameFiles,
    audioPath,
  });

  const visualFrames = selectUsefulFrames({
    frameFiles,
    maxFrames: 20,
  });

  const visualAnalysis = await analyzeVisualFrames({
    frameFiles: visualFrames,
  });

  const candidateResult = await discoverSceneCandidates({
    ocrText: signals.ocr.text,
    speechText: signals.speech.text,
    caption,
    visualAnalysis,
  });

  const candidates = candidateResult?.candidates || [];

  if (!candidates.length || !visualFrames.length) {
    return {
      signals,
      visualAnalysis,
      artworkSimilarityMatches: [],
      caption,
      queries: candidateResult?.queries || [],
      candidates: [],
      bestMatch: null,
    };
  }

  console.log(
    "Scene Finder V2 candidate pool:",
    candidates.length
  );

  const artworkCandidates = await getCandidateArtwork(
    candidates,
    Math.min(
      candidates.length,
      Number(process.env.SCENE_FINDER_ARTWORK_CANDIDATES || 60)
    )
  );

  console.log(
    "Scene Finder V2 artwork references:",
    artworkCandidates.length
  );

  const artworkSimilarityMatches = await analyzeArtworkSimilarity({
    frameFiles: selectUsefulFrames({
      frameFiles: visualFrames,
      maxFrames: 12,
    }),
    candidateArtwork: artworkCandidates,
  });

  const scored = candidates.map((candidate) => {
    const text = scoreTextEvidence(
      candidate,
      caption,
      signals.ocr.text,
      signals.speech.text
    );

    const artwork = aggregateArtwork(
      artworkSimilarityMatches,
      candidate
    );

    const textScore =
      text.exact
        ? 1
        : text.captionScore * 0.25 +
          text.ocrScore * 0.4 +
          text.speechScore * 0.35;

    const visualScore =
      artwork.average * 0.55 +
      artwork.max * 0.25 +
      Math.min(1, artwork.matchedFrames / 4) * 0.20;

    const corroborated =
      text.exact ||
      (text.independent >= 2 && text.strongest >= 0.55) ||
      (
        artwork.average >= 0.58 &&
        artwork.max >= 0.68 &&
        artwork.matchedFrames >= 2
      );

    let finalScore =
      textScore * 0.55 +
      visualScore * 0.45;

    if (text.exact) finalScore = Math.max(finalScore, 0.98);

    if (!corroborated) {
      finalScore = Math.min(finalScore, 0.58);
    }

    const confidence = Math.round(
      Math.max(0, Math.min(0.99, finalScore)) * 100
    );

    return {
      candidate,
      title: candidate.title,
      contentId: candidate.contentId,
      contentType: candidate.contentType,
      releaseDate: candidate.releaseDate,
      rating: candidate.rating,
      image: candidate.image,
      confidence,
      sceneScore: Number(finalScore.toFixed(4)),
      evidenceType: text.exact
        ? "text-exact"
        : artwork.average >= 0.58
          ? "artwork-visual"
          : text.independent >= 2
            ? "text-multi-signal"
            : text.strongest >= 0.55
              ? "text"
              : "none",
      evidence: {
        captionScore: Number(text.captionScore.toFixed(4)),
        ocrScore: Number(text.ocrScore.toFixed(4)),
        speechScore: Number(text.speechScore.toFixed(4)),
        artworkAverage: Number(artwork.average.toFixed(4)),
        artworkMax: Number(artwork.max.toFixed(4)),
        artworkMatchedFrames: artwork.matchedFrames,
      },
    };
  }).sort((a, b) => {
    if (b.sceneScore !== a.sceneScore) {
      return b.sceneScore - a.sceneScore;
    }
    return b.evidence.artworkMatchedFrames -
      a.evidence.artworkMatchedFrames;
  });

  const best = scored[0] || null;
  const second = scored[1] || null;
  const margin = best && second
    ? best.sceneScore - second.sceneScore
    : best?.sceneScore || 0;

  const accepted =
    best &&
    (
      best.evidenceType === "text-exact" ||
      (
        best.sceneScore >= 0.63 &&
        margin >= 0.045 &&
        (
          best.evidence.artworkMatchedFrames >= 2 ||
          best.evidence.ocrScore >= 0.72 ||
          best.evidence.speechScore >= 0.72
        )
      )
    );

  console.log("Scene Finder V2 top candidates:", scored.slice(0, 8));

  return {
    signals,
    visualAnalysis,
    artworkSimilarityMatches,
    caption,
    queries: candidateResult?.queries || [],
    candidates: scored,
    bestMatch: accepted ? best : null,
  };
};

module.exports = {
  analyzeSceneEvidence,
};