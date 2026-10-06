const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const fuseEvidenceLayers = ({
  visualMatches = [],
  ocrCandidates = [],
  speechCandidate = null,
  artworkMatches = [],
  episodeEvidence = null,
} = {}) => {
  const candidates = new Map();

  visualMatches.forEach((match) => {
    const key = `${match.movieId || match.showId}`;
    const existing = candidates.get(key) || {
      id: match.movieId || match.showId,
      title: match.title,
      type: match.type,
      visualScore: 0,
      artworkScore: 0,
      ocrSupport: 0,
      speechSupport: 0,
      temporalSupport: 0,
      frameCount: 0,
      evidenceLayers: [],
    };
    existing.visualScore = Math.max(existing.visualScore, Number(match.score || 0));
    existing.evidenceLayers.push('visual');
    existing.frameCount += 1;
    candidates.set(key, existing);
  });

  ocrCandidates.forEach((candidate) => {
    const key = `${candidate.movieId || candidate.showId}`;
    const existing = candidates.get(key) || {
      id: candidate.movieId || candidate.showId,
      title: candidate.title,
      type: candidate.type,
      visualScore: 0,
      artworkScore: 0,
      ocrSupport: 0,
      speechSupport: 0,
      temporalSupport: 0,
      frameCount: 0,
      evidenceLayers: [],
    };
    existing.ocrSupport = Math.max(existing.ocrSupport, Number(candidate.score || 0));
    existing.evidenceLayers.push('ocr');
    candidates.set(key, existing);
  });

  artworkMatches.forEach((match) => {
    const key = `${match.movieId || match.showId}`;
    const existing = candidates.get(key) || {
      id: match.movieId || match.showId,
      title: match.title,
      type: match.type,
      visualScore: 0,
      artworkScore: 0,
      ocrSupport: 0,
      speechSupport: 0,
      temporalSupport: 0,
      frameCount: 0,
      evidenceLayers: [],
    };
    existing.artworkScore = Math.max(existing.artworkScore, Number(match.score || 0));
    existing.evidenceLayers.push('artwork');
    candidates.set(key, existing);
  });

  if (speechCandidate) {
    const key = `${speechCandidate.movieId || speechCandidate.showId}`;
    const existing = candidates.get(key) || {
      id: speechCandidate.movieId || speechCandidate.showId,
      title: speechCandidate.title,
      type: speechCandidate.type,
      visualScore: 0,
      artworkScore: 0,
      ocrSupport: 0,
      speechSupport: 0,
      temporalSupport: 0,
      frameCount: 0,
      evidenceLayers: [],
    };
    existing.speechSupport = Number(speechCandidate.score || 0);
    existing.evidenceLayers.push('speech');
    candidates.set(key, existing);
  }

  const ranked = Array.from(candidates.values())
    .map((candidate) => ({
      ...candidate,
      visualScore: clamp(candidate.visualScore, 0, 1),
      artworkScore: clamp(candidate.artworkScore, 0, 1),
      ocrSupport: clamp(candidate.ocrSupport, 0, 1),
      speechSupport: clamp(candidate.speechSupport, 0, 1),
      uniqueLayers: [...new Set(candidate.evidenceLayers)].length,
      compositeScore: Number(
        (
          candidate.visualScore * 0.35 +
          candidate.artworkScore * 0.25 +
          candidate.ocrSupport * 0.2 +
          candidate.speechSupport * 0.1 +
          candidate.frameCount / Math.max(1, visualMatches.length + ocrCandidates.length) * 0.1
        ).toFixed(3)
      ),
    }))
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  return ranked;
};

const calculateCandidateMargin = (ranked = []) => {
  if (!Array.isArray(ranked) || ranked.length < 2) {
    return 0;
  }

  const top = Number(ranked[0]?.compositeScore || 0);
  const second = Number(ranked[1]?.compositeScore || 0);

  return clamp(Number((top - second).toFixed(3)), 0, 1);
};

module.exports = {
  fuseEvidenceLayers,
  calculateCandidateMargin,
  clamp,
};
