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
   * CLIP is used as a second-stage reranker.
   * Candidate generation still comes from caption/OCR/speech,
   * so vision cannot invent an unrelated TMDB title.
   *
   * Keep the label set bounded because zero-shot image
   * classification evaluates the supplied candidate labels
   * for every frame.
   */
  let visualRecognition = {
    framesAnalyzed: 0,
    matches: [],
  };

  if (candidates.length && visualFrames.length) {
    const visualCandidateLabels = unique(
      candidates
        .slice(0, 20)
        .flatMap((candidate) => [
          candidate.title,
          candidate.originalTitle,
        ])
    ).slice(0, 20);

    visualRecognition =
      await analyzeVisualRecognition({
        frameFiles: visualFrames.slice(0, 6),
        candidateLabels:
          visualCandidateLabels,
      });

    console.log(
      "CLIP visual candidate matches:",
      visualRecognition.matches.slice(0, 5)
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