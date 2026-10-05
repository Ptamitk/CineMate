const { analyzeSceneSignals } = require("./sceneSignals.service");
const { discoverSceneCandidates } = require("./sceneDiscovery.service");
const { getCandidateArtwork } = require("./tmdbArtwork.service");
const { getCandidateEpisodeArtwork } = require("./tvEpisodeArtwork.service");
const { analyzeArtworkSimilarity } = require("./visualRecognition.service");
const { selectUsefulFrames } = require("./frameSelection.service");

const normalize = (value = "") =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (value = "") =>
  new Set(normalize(value).split(" ").filter((token) => token.length > 1));

const titleSimilarity = (source, title, originalTitle) => {
  const sourceTokens = tokens(source);
  if (!sourceTokens.size) return 0;

  return Math.max(
    ...[title, originalTitle].map((candidateTitle) => {
      const candidateTokens = tokens(candidateTitle);
      if (!candidateTokens.size) return 0;

      const overlap = [...sourceTokens].filter((token) =>
        candidateTokens.has(token)
      ).length;

      const precision = overlap / sourceTokens.size;
      const recall = overlap / candidateTokens.size;

      return Math.max(
        precision * 0.65 + recall * 0.35,
        overlap === candidateTokens.size ? 0.9 : 0
      );
    })
  );
};

const scoreTextEvidence = (candidate, caption, ocr, speech) => {
  const title = candidate.title || "";
  const original = candidate.originalTitle || "";
  const captionScore = titleSimilarity(caption, title, original);
  const ocrScore = titleSimilarity(ocr, title, original);
  const speechScore = titleSimilarity(speech, title, original);

  const exact = [caption, ocr, speech].some((text) => {
    const source = normalize(text);
    return source &&
      [title, original].some((name) => source === normalize(name));
  });

  const strongest = Math.max(captionScore, ocrScore, speechScore);
  const independent = [captionScore, ocrScore, speechScore]
    .filter((score) => score >= 0.58).length;

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
  const title = normalize(candidate.title);
  const original = normalize(candidate.originalTitle);

  const rows = matches.filter((item) => {
    const label = normalize(item.label);
    return label === title || label === original;
  });

  if (!rows.length) return { average: 0, max: 0, matchedFrames: 0 };

  const similarities = rows
    .map((item) => Number(item.imageSimilarity || 0))
    .sort((a, b) => b - a);

  return {
    average:
      similarities.slice(0, 3).reduce((sum, value) => sum + value, 0) /
      Math.min(3, similarities.length),
    max: similarities[0] || 0,
    matchedFrames: Math.max(
      ...rows.map((item) => Number(item.imageFramesMatched || 0))
    ),
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
    maxFrames: Math.max(
      12,
      Math.min(20, Number(process.env.SCENE_FINDER_VISUAL_FRAMES || 18))
    ),
  });

  const candidateResult = await discoverSceneCandidates({
    caption,
    ocrText: signals.ocr.text,
    speechText: signals.speech.text,
  });

  const candidates = candidateResult?.candidates || [];

  if (!candidates.length || !visualFrames.length) {
    return {
      signals,
      caption,
      queries: candidateResult?.queries || [],
      candidates: [],
      bestMatch: null,
      artworkSimilarityMatches: [],
      episodeSimilarityMatches: [],
    };
  }

  const artworkLimit = Math.min(
    candidates.length,
    Math.max(12, Number(process.env.SCENE_FINDER_ARTWORK_CANDIDATES || 42))
  );

  const artworkCandidates = await getCandidateArtwork(
    candidates,
    artworkLimit
  );

  const tvCandidates = candidates.filter(
    (candidate) => candidate.contentType === "tv"
  );

  const episodeArtwork = await getCandidateEpisodeArtwork(
    tvCandidates,
    Math.min(
      tvCandidates.length,
      Number(process.env.SCENE_FINDER_EPISODE_CANDIDATES || 8)
    )
  );

  const artworkFrames = selectUsefulFrames({
    frameFiles: visualFrames,
    maxFrames: Math.min(
      12,
      Number(process.env.SCENE_FINDER_ARTWORK_FRAMES || 12)
    ),
  });

  const [artworkSimilarityMatches, episodeSimilarityMatches] =
    await Promise.all([
      analyzeArtworkSimilarity({
        frameFiles: artworkFrames,
        candidateArtwork: artworkCandidates,
      }),
      analyzeArtworkSimilarity({
        frameFiles: artworkFrames,
        candidateArtwork: episodeArtwork,
      }),
    ]);

  const scored = candidates
    .map((candidate) => {
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

      const episodeArtworkMatch = aggregateArtwork(
        episodeSimilarityMatches,
        candidate
      );

      const textScore = text.exact
        ? 1
        : text.captionScore * 0.22 +
          text.ocrScore * 0.43 +
          text.speechScore * 0.35;

      const visualScore =
        artwork.average * 0.34 +
        artwork.max * 0.18 +
        Math.min(1, artwork.matchedFrames / 4) * 0.12 +
        episodeArtworkMatch.average * 0.20 +
        episodeArtworkMatch.max * 0.10 +
        Math.min(1, episodeArtworkMatch.matchedFrames / 3) * 0.06;

      const corroborated =
        text.exact ||
        (text.independent >= 2 && text.strongest >= 0.58) ||
        (artwork.average >= 0.56 &&
          artwork.max >= 0.66 &&
          artwork.matchedFrames >= 2) ||
        (episodeArtworkMatch.average >= 0.56 &&
          episodeArtworkMatch.max >= 0.66 &&
          episodeArtworkMatch.matchedFrames >= 2);

      let finalScore =
        textScore * 0.55 +
        visualScore * 0.45 +
        Math.min(0.05, Number(candidate.popularity || 0) / 2000);

      if (text.exact) finalScore = Math.max(finalScore, 0.985);
      if (!corroborated) finalScore = Math.min(finalScore, 0.57);

      return {
        title: candidate.title,
        contentId: candidate.contentId,
        contentType: candidate.contentType,
        releaseDate: candidate.releaseDate,
        rating: candidate.rating,
        image: candidate.image,
        confidence: Math.round(Math.min(0.995, finalScore) * 100),
        sceneScore: Number(Math.min(0.995, finalScore).toFixed(4)),
        evidenceType: text.exact
          ? "text-exact"
          : episodeArtworkMatch.average >= 0.56
            ? "episode-visual"
            : artwork.average >= 0.56
              ? "artwork-visual"
              : text.independent >= 2
                ? "text-multi-signal"
                : text.strongest >= 0.58
                  ? "text"
                  : "none",
        evidence: {
          captionScore: Number(text.captionScore.toFixed(4)),
          ocrScore: Number(text.ocrScore.toFixed(4)),
          speechScore: Number(text.speechScore.toFixed(4)),
          artworkAverage: Number(artwork.average.toFixed(4)),
          artworkMax: Number(artwork.max.toFixed(4)),
          artworkMatchedFrames: artwork.matchedFrames,
          episodeArtworkAverage: Number(
            episodeArtworkMatch.average.toFixed(4)
          ),
          episodeArtworkMax: Number(episodeArtworkMatch.max.toFixed(4)),
          episodeArtworkMatchedFrames:
            episodeArtworkMatch.matchedFrames,
        },
      };
    })
    .sort((a, b) => {
      if (b.sceneScore !== a.sceneScore) {
        return b.sceneScore - a.sceneScore;
      }
      return (
        b.evidence.artworkMatchedFrames +
        b.evidence.episodeArtworkMatchedFrames -
        (a.evidence.artworkMatchedFrames +
          a.evidence.episodeArtworkMatchedFrames)
      );
    });

  const best = scored[0] || null;
  const second = scored[1] || null;
  const margin =
    best && second
      ? best.sceneScore - second.sceneScore
      : best?.sceneScore || 0;

  const accepted =
    Boolean(best) &&
    (best.evidenceType === "text-exact" ||
      (best.sceneScore >= 0.63 &&
        margin >= 0.045 &&
        (best.evidence.artworkMatchedFrames >= 2 ||
          best.evidence.episodeArtworkMatchedFrames >= 2 ||
          best.evidence.ocrScore >= 0.72 ||
          best.evidence.speechScore >= 0.72)));

  console.log(
    "Scene Finder V3 ranking:",
    scored.slice(0, 8).map((item) => ({
      title: item.title,
      score: item.sceneScore,
      evidenceType: item.evidenceType,
      evidence: item.evidence,
    }))
  );

  return {
    signals,
    caption,
    queries: candidateResult?.queries || [],
    candidates: scored,
    bestMatch: accepted ? best : null,
    artworkSimilarityMatches,
    episodeSimilarityMatches,
  };
};

module.exports = {
  analyzeSceneEvidence,
};