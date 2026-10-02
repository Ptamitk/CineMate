const { analyzeSceneSignals } = require("./sceneSignals.service");
const { findSceneCandidates } = require("./sceneCandidate.service");
const { matchSceneCandidates } = require("./sceneMatcher.service");
const { analyzeVisualFrames } = require("./visualAnalysis.service");
const {
  analyzeVisualRecognition,
} = require("./visualRecognition.service");
const { selectUsefulFrames } = require("./frameSelection.service");

const unique = (items) => [
  ...new Set(items.filter(Boolean)),
];

const analyzeScene = async ({
  frameFiles = [],
  ocrFrameFiles = [],
  audioPath = null,
  caption = "",
}) => {
  console.log("Starting Scene Finder analysis...");

  const signals = await analyzeSceneSignals({
    frameFiles:
      ocrFrameFiles.length
        ? ocrFrameFiles
        : frameFiles,
    audioPath,
  });

  console.log("Scene signals extracted.");
  console.log("OCR TEXT:", signals.ocr.text);
  console.log("SPEECH TEXT:", signals.speech.text);
  console.log("REEL CAPTION:", caption);

  const visualFrames = selectUsefulFrames({
    frameFiles,
    maxFrames: 12,
  });

  const visualAnalysis =
    await analyzeVisualFrames({
      frameFiles: visualFrames,
    });

  console.log(
    `Visual frames prepared: ${visualAnalysis.framesAnalyzed}`
  );

  const candidateResult =
    await findSceneCandidates({
      ocrText: signals.ocr.text,
      speechText: signals.speech.text,
      caption,
      visualAnalysis,
    });

  const candidates =
    candidateResult?.candidates || [];

  /*
   * CLIP is the visual verification stage.
   * When text discovery fails, candidate generation supplies a
   * bounded TMDB pool so CLIP can search by actual media titles.
   *
   * Keep the pool bounded because zero-shot image classification
   * evaluates every supplied candidate label for every frame.
   */
  let visualRecognition = {
    framesAnalyzed: 0,
    matches: [],
  };

  if (candidates.length && visualFrames.length) {
    const visualCandidateLabels = unique(
      candidates
        .slice(0, 120)
        .flatMap((candidate) => [
          candidate.title,
          candidate.originalTitle,
        ])
    );

    /*
     * IMPORTANT:
     * Never let the first N TMDB candidates decide which titles CLIP
     * is allowed to see. That created a "forced winner" problem:
     * if the real title was candidate #61+, CLIP could never select it.
     *
     * Broad retrieval now evaluates the ENTIRE bounded candidate pool
     * in small chunks. Scores from different chunks are used only for
     * shortlist generation; the final decision is made by one common
     * refined CLIP pass, where all shortlisted titles compete against
     * each other in the same label set.
     */
    const broadFrames = selectUsefulFrames({
      frameFiles: visualFrames,
      maxFrames: 4,
    });

    const chunkSize = 30;
    const broadMatches = [];

    for (
      let start = 0;
      start < visualCandidateLabels.length;
      start += chunkSize
    ) {
      const chunkLabels =
        visualCandidateLabels.slice(
          start,
          start + chunkSize
        );

      if (!chunkLabels.length) {
        continue;
      }

      try {
        const chunkRecognition =
          await analyzeVisualRecognition({
            frameFiles: broadFrames,
            candidateLabels: chunkLabels,
          });

        broadMatches.push(
          ...chunkRecognition.matches
        );
      } catch (error) {
        console.error(
          "Broad visual retrieval chunk failed:",
          error.message
        );
      }
    }

    /*
     * Across chunks, relativeAverageScore is the useful ranking
     * signal. Prefer repeated frame agreement over a single-frame
     * spike, and keep only a compact shortlist for the expensive
     * all-frame refinement pass.
     */
    const refinedLabels = unique(
      broadMatches
        .sort((a, b) => {
          const repeatedFrameDifference =
            Number(b.topFrameCount || 0) -
            Number(a.topFrameCount || 0);

          if (repeatedFrameDifference !== 0) {
            return repeatedFrameDifference;
          }

          return (
            Number(b.relativeAverageScore || 0) -
            Number(a.relativeAverageScore || 0)
          );
        })
        .slice(0, 24)
        .map((match) => match.label)
    );

    if (refinedLabels.length) {
      visualRecognition =
        await analyzeVisualRecognition({
          frameFiles: visualFrames,
          candidateLabels: refinedLabels,
        });
    } else {
      visualRecognition = {
        framesAnalyzed: 0,
        matches: [],
      };
    }

    console.log(
      "CLIP visual candidate matches:",
      visualRecognition.matches.slice(0, 10)
    );
  }

  const matches =
    matchSceneCandidates({
      candidates,
      extractedCaptionTitle:
        candidateResult?.extractedCaptionTitle || "",
      captionYear:
        candidateResult?.captionYear || null,
      captionType:
        candidateResult?.captionType || "",
      ocrText: signals.ocr.text,
      speechText: signals.speech.text,
      visualSignals:
        candidateResult?.visualSignals || [],
      visualRecognitionMatches:
        visualRecognition.matches || [],
    }) || [];

  const bestMatch =
    matches.length > 0
      ? matches[0]
      : null;

  return {
    signals,
    visualAnalysis,
    visualRecognition,
    caption,
    extractedCaptionTitle:
      candidateResult?.extractedCaptionTitle || "",
    captionYear:
      candidateResult?.captionYear || null,
    captionType:
      candidateResult?.captionType || "",
    queries:
      candidateResult?.queries || [],
    candidates: matches,
    bestMatch,
  };
};

module.exports = {
  analyzeScene,
};