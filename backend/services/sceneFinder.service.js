
const isValidInstagramReelUrl = (reelUrl) => {
  try {
    const url = new URL(reelUrl);

    const isInstagramHost =
      url.hostname === "instagram.com" ||
      url.hostname === "www.instagram.com";

    const isReelPath =
      url.pathname.startsWith("/reel/") ||
      url.pathname.startsWith("/reels/");

    return isInstagramHost && isReelPath;
  } catch {
    return false;
  }
};

const analyzeReelScene = async (mediaSource) => {
  if (!mediaSource?.trim()) {
    throw new Error(
      "Scene media source is required."
    );
  }

  const normalizedSource =
    mediaSource.trim();

  /*
    Scene Finder Processing Pipeline

    1. Receive normalized media source
    2. Obtain allowed/public media input
    3. Extract video frames
    4. Extract visible text / subtitles
    5. Extract audio / dialogue
    6. Analyze scene signals
    7. Generate movie/series candidates
    8. Match candidates with CineMate content data
    9. Calculate confidence score
    10. Return the highest-confidence match
  */

  return {
    status: "pending",
    source: normalizedSource,
    match: null,
    confidence: null,
  };
};

module.exports = {
  analyzeReelScene,
  isValidInstagramReelUrl,
};

