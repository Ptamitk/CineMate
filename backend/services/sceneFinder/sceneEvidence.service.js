const { analyzeSceneSignals } = require("./sceneSignals.service");
const { discoverSceneCandidates } = require("./sceneDiscovery.service");
const { getCandidateArtwork } = require("./tmdbArtwork.service");
const { getCandidateEpisodeArtwork } = require("./tvEpisodeArtwork.service");
const { analyzeArtworkSimilarity, analyzeCandidateVisualLabels } = require("./visualRecognition.service");
const { selectUsefulFrames } = require("./frameSelection.service");
const { overlapScore, exactTitle, extractTextEvidence } = require("./evidenceCleanup.service");

const aggregate = (matches, candidate) => {
  const rows = (matches || []).filter(item =>
    Number(item.contentId) === Number(candidate.contentId) &&
    item.contentType === candidate.contentType
  );
  if (!rows.length) return { average: 0, max: 0, matchedFrames: 0, temporalConsistency: 0, bestEpisode: null };

  const scores = rows.map(x => Number(x.imageSimilarity || 0)).sort((a, b) => b - a);
  const strong = rows.filter(x => Number(x.imageSimilarity || 0) >= 0.72);

  return {
    average: scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length),
    max: scores[0] || 0,
    matchedFrames: Math.max(0, ...strong.map(x => Number(x.imageFramesMatched || 0))),
    temporalConsistency: Math.max(0, ...rows.map(x => Number(x.temporalConsistency || 0))),
    bestEpisode: rows.filter(x => x.seasonNumber)
      .sort((a, b) => Number(b.imageSimilarity || 0) - Number(a.imageSimilarity || 0))[0] || null
  };
};

const aggregateLabel = (matches, candidate) => {
  const row = (matches || []).find(item =>
    Number(item.contentId) === Number(candidate.contentId) &&
    item.contentType === candidate.contentType
  );
  return row || {
    visualLabelScore: 0,
    visualLabelMax: 0,
    visualLabelMatchedFrames: 0,
    visualLabelTemporalConsistency: 0
  };
};

const textEvidence = (candidate, text) => {
  const captionScore = overlapScore(text.caption, candidate.title, candidate.originalTitle);
  const ocrScore = overlapScore(text.ocr, candidate.title, candidate.originalTitle);
  const stableOcrScore = overlapScore(text.stableOcr, candidate.title, candidate.originalTitle);
  const speechScore = overlapScore(text.speech, candidate.title, candidate.originalTitle);
  const captionExact = exactTitle(text.caption, candidate.title, candidate.originalTitle);
  const speechExact = exactTitle(text.speech, candidate.title, candidate.originalTitle);
  const stableOcrExact = exactTitle(text.stableOcr, candidate.title, candidate.originalTitle);
  const exact = captionExact || speechExact || stableOcrExact;
  const independent = [stableOcrScore, speechScore].filter(x => x >= 0.72).length;

  return { captionScore, ocrScore, stableOcrScore, speechScore, captionExact, speechExact, stableOcrExact, exact, independent };
};

const analyzeSceneEvidence = async ({ frameFiles = [], ocrFrameFiles = [], audioPath = null, caption = "" }) => {
  const signals = await analyzeSceneSignals({
    frameFiles: ocrFrameFiles.length ? ocrFrameFiles : frameFiles,
    audioPath
  });

  const text = extractTextEvidence({
    caption,
    ocrResults: signals.ocr.results || [],
    speech: signals.speech.text || ""
  });

  const visualFrames = selectUsefulFrames({
    frameFiles,
    maxFrames: Math.max(10, Math.min(16, Number(process.env.SCENE_FINDER_VISUAL_FRAMES || 12)))
  });

  // Fast-path: when the evidence already contains an exact, strong title,
  // do not spend time on broad visual/episode analysis.
  const fastText = [text.caption, text.stableOcr, text.speech]
    .filter(Boolean)
    .join(" ");
  const fastCandidateResult = await discoverSceneCandidates({
    caption: text.caption,
    ocrText: text.stableOcr || text.ocr,
    speechText: text.speech
  });
  const fastCandidates = fastCandidateResult?.candidates || [];
  const exactFast = fastCandidates
    .map(candidate => ({ candidate, exact: exactTitle(fastText, candidate.title, candidate.originalTitle) }))
    .filter(item => item.exact)
    .map(item => item.candidate);

  const fastArtworkCandidates = fastCandidates.filter(candidate =>
    exactFast.some(exact => exact.contentId === candidate.contentId && exact.contentType === candidate.contentType)
  );

  if (exactFast.length === 1 && fastCandidates.length <= 20) {
    const candidate = exactFast[0];
    const result = {
      ...candidate,
      confidence: 95,
      sceneScore: 0.95,
      evidenceType: "text-exact",
      episode: null,
      evidence: {
        captionScore: 0,
        ocrScore: 1,
        stableOcrScore: 1,
        speechScore: 0,
        artworkAverage: 0,
        artworkMax: 0,
        artworkMatchedFrames: 0,
        artworkTemporalConsistency: 0,
        visualLabelScore: 0,
        visualLabelMax: 0,
        visualLabelMatchedFrames: 0,
        visualLabelTemporalConsistency: 0,
        episodeArtworkAverage: 0,
        episodeArtworkMax: 0,
        episodeArtworkMatchedFrames: 0,
        episodeTemporalConsistency: 0
      }
    };
    return {
      signals,
      caption,
      queries: fastCandidateResult?.queries || [],
      candidates: [result],
      bestMatch: result,
      artworkSimilarityMatches: [],
      episodeSimilarityMatches: [],
      visualLabelMatches: []
    };
  }

  const candidateResult = fastCandidateResult;
  const candidates = candidateResult?.candidates || [];

  if (!candidates.length || !visualFrames.length) {
    return {
      signals, caption, queries: candidateResult?.queries || [], candidates: [],
      bestMatch: null, artworkSimilarityMatches: [], episodeSimilarityMatches: [], visualLabelMatches: []
    };
  }

  const artworkCandidates = await getCandidateArtwork(
    candidates,
    Math.min(candidates.length, Math.max(20, Number(process.env.SCENE_FINDER_ARTWORK_CANDIDATES || 64)))
  );

  const tvCandidates = candidates.filter(x => x.contentType === "tv");
  const episodeArtwork = await getCandidateEpisodeArtwork(
    tvCandidates,
    Math.min(tvCandidates.length, Number(process.env.SCENE_FINDER_EPISODE_CANDIDATES || 8))
  );

  const artworkFrames = selectUsefulFrames({
    frameFiles: visualFrames,
    maxFrames: Math.min(14, Number(process.env.SCENE_FINDER_ARTWORK_FRAMES || 14))
  });

  const [artworkSimilarityMatches, episodeSimilarityMatches] = await Promise.all([
    analyzeArtworkSimilarity({ frameFiles: artworkFrames, candidateArtwork: artworkCandidates }),
    analyzeArtworkSimilarity({ frameFiles: artworkFrames, candidateArtwork: episodeArtwork })
  ]);

  const artworkRankedIds = [...artworkSimilarityMatches]
    .sort((a, b) => Number(b.imageSimilarity || 0) - Number(a.imageSimilarity || 0))
    .slice(0, 12)
    .map(x => `${x.contentType}:${x.contentId}`);

  const visualLabelCandidates = candidates
    .filter(candidate =>
      artworkRankedIds.includes(`${candidate.contentType}:${candidate.contentId}`) ||
      candidates.indexOf(candidate) < 16
    )
    .slice(0, Math.max(8, Math.min(32, Number(process.env.SCENE_FINDER_VISUAL_LABEL_CANDIDATES || 32))));

  const visualLabelMatches = await analyzeCandidateVisualLabels({
    frameFiles: artworkFrames,
    candidates: visualLabelCandidates
  });

  const scored = candidates.map(candidate => {
    const t = textEvidence(candidate, text);
    const art = aggregate(artworkSimilarityMatches, candidate);
    const ep = aggregate(episodeSimilarityMatches, candidate);
    const label = aggregateLabel(visualLabelMatches, candidate);

    const textScore = t.exact
      ? 0.97
      : Math.max(t.stableOcrScore * 0.52, t.speechScore * 0.40, t.captionScore * 0.28);

    const artworkScore = Math.max(
      art.average * 0.58 + art.max * 0.17 + art.temporalConsistency * 0.25,
      ep.average * 0.62 + ep.max * 0.18 + ep.temporalConsistency * 0.20
    );

    const labelScore =
      label.visualLabelScore * 0.58 +
      label.visualLabelMax * 0.17 +
      label.visualLabelTemporalConsistency * 0.25;

    // Relative CLIP evidence is intentionally calibrated separately from the
    // absolute artwork cosine score. Artwork stills can differ substantially
    // from the exact uploaded frame (crop, lighting, pose, subtitle overlay),
    // while a repeated, high-margin label winner can remain highly useful.
    const visualScore = Math.max(
      artworkScore * 0.42 + labelScore * 0.58,
      labelScore
    );

    const strongRelativeVisual =
      label.visualLabelScore >= 0.52 &&
      label.visualLabelMax >= 0.68 &&
      label.visualLabelMatchedFrames >= 4 &&
      label.visualLabelTemporalConsistency >= 0.35 &&
      label.visualLabelMargin >= 0.18;

    const strongArtworkVisual =
      (art.average >= 0.58 && art.max >= 0.66 && art.matchedFrames >= 2) ||
      (ep.average >= 0.58 && ep.max >= 0.64 && ep.matchedFrames >= 2);

    const visualCorroborated =
      strongRelativeVisual ||
      strongArtworkVisual ||
      (label.visualLabelScore >= 0.45 &&
        label.visualLabelMatchedFrames >= 3 &&
        label.visualLabelTemporalConsistency >= 0.25 &&
        label.visualLabelMargin >= 0.08);

    const textCorroborated = t.exact || t.independent >= 1;
    let score = textScore * 0.25 + visualScore * 0.75;

    if (!textCorroborated && !visualCorroborated) score = Math.min(score, 0.54);
    if (t.exact) score = Math.max(score, 0.92);

    const episode = ep.bestEpisode;

    return {
      title: candidate.title,
      contentId: candidate.contentId,
      contentType: candidate.contentType,
      releaseDate: candidate.releaseDate,
      rating: candidate.rating,
      image: candidate.image,
      confidence: Math.round(Math.min(0.98, score) * 100),
      sceneScore: Number(Math.min(0.98, score).toFixed(4)),
      evidenceType: episode ? "episode-visual" : visualCorroborated ? "visual" : t.exact ? "text-exact" : t.independent ? "text-corroborated" : "weak",
      episode: episode ? {
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        episodeName: episode.episodeName || ""
      } : null,
      evidence: {
        captionScore: Number(t.captionScore.toFixed(4)),
        ocrScore: Number(t.ocrScore.toFixed(4)),
        stableOcrScore: Number(t.stableOcrScore.toFixed(4)),
        speechScore: Number(t.speechScore.toFixed(4)),
        artworkAverage: Number(art.average.toFixed(4)),
        artworkMax: Number(art.max.toFixed(4)),
        artworkMatchedFrames: art.matchedFrames,
        artworkTemporalConsistency: Number(art.temporalConsistency.toFixed(4)),
        visualLabelScore: Number(label.visualLabelScore.toFixed(4)),
        visualLabelMax: Number(label.visualLabelMax.toFixed(4)),
        visualLabelMatchedFrames: label.visualLabelMatchedFrames,
        visualLabelTemporalConsistency: Number(label.visualLabelTemporalConsistency.toFixed(4)),
        visualLabelMargin: Number((label.visualLabelMargin || 0).toFixed(4)),
        episodeArtworkAverage: Number(ep.average.toFixed(4)),
        episodeArtworkMax: Number(ep.max.toFixed(4)),
        episodeArtworkMatchedFrames: ep.matchedFrames,
        episodeTemporalConsistency: Number(ep.temporalConsistency.toFixed(4))
      }
    };
  }).sort((a, b) => b.sceneScore - a.sceneScore);

  const best = scored[0] || null;
  const second = scored[1] || null;
  const margin = best && second ? best.sceneScore - second.sceneScore : 0;
  // A visual-only match must be genuinely strong. CLIP can be confidently
  // wrong on visually similar frames, so a high relative label score alone
  // is never enough to accept a title.
  const visualAccepted = Boolean(best) &&
    best.evidenceType === "visual" &&
    margin >= 0.07 &&
    (
      (
        best.sceneScore >= 0.62 &&
        Number(best.evidence?.visualLabelScore || 0) >= 0.52 &&
        Number(best.evidence?.visualLabelMax || 0) >= 0.68 &&
        Number(best.evidence?.visualLabelMatchedFrames || 0) >= 4 &&
        Number(best.evidence?.visualLabelTemporalConsistency || 0) >= 0.35 &&
        Number(best.evidence?.visualLabelMargin || 0) >= 0.18
      ) ||
      (
        best.sceneScore >= 0.66 &&
        Number(best.evidence?.artworkMatchedFrames || 0) >= 2 &&
        Number(best.evidence?.artworkAverage || 0) >= 0.58
      ) ||
      (
        best.sceneScore >= 0.66 &&
        Number(best.evidence?.episodeArtworkMatchedFrames || 0) >= 2 &&
        Number(best.evidence?.episodeArtworkAverage || 0) >= 0.58
      )
    );

  const corroboratedTextAccepted = Boolean(best) &&
    best.evidenceType === "text-corroborated" &&
    best.sceneScore >= 0.72 &&
    margin >= 0.07;

  const exactTextAccepted = Boolean(best) &&
    best.evidenceType === "text-exact" &&
    best.sceneScore >= 0.92 &&
    margin >= 0.035;

  const accepted = visualAccepted || corroboratedTextAccepted || exactTextAccepted;

  const rejectionReason = !best
    ? "no-candidates"
    : !accepted
      ? best.sceneScore < 0.72
        ? "best-score-below-threshold"
        : margin < (best.evidenceType === "text-exact" ? 0.035 : 0.07)
          ? "insufficient-margin"
          : best.evidenceType === "visual" && (
              Number(best.evidence?.visualLabelScore || 0) < 0.55 ||
              Number(best.evidence?.visualLabelMatchedFrames || 0) < 3 ||
              Number(best.evidence?.visualLabelTemporalConsistency || 0) < 0.30
            )
            ? "visual-corroboration-too-weak"
            : "evidence-policy-rejected"
      : "accepted";

  console.log("Scene Finder production decision:", {
    accepted,
    bestTitle: best?.title || "",
    bestScore: best?.sceneScore || 0,
    margin: Number(margin.toFixed(4)),
    reason: rejectionReason,
    artworkMatches: artworkSimilarityMatches.length,
    episodeArtworkMatches: episodeSimilarityMatches.length,
    visualLabelMatches: visualLabelMatches.length,
  });

  console.log("Scene Finder production ranking:", scored.slice(0, 8).map(x => ({
    title: x.title, score: x.sceneScore, evidenceType: x.evidenceType, episode: x.episode, evidence: x.evidence
  })));

  return {
    signals,
    caption,
    queries: candidateResult?.queries || [],
    candidates: scored,
    bestMatch: accepted ? best : null,
    artworkSimilarityMatches,
    episodeSimilarityMatches,
    visualLabelMatches
  };
};

module.exports = { analyzeSceneEvidence };
