const { analyzeSceneSignals } = require("./sceneSignals.service");
const { findSceneCandidates } = require("./sceneCandidate.service");
const { matchSceneCandidates } = require("./sceneMatcher.service");
const { analyzeVisualFrames } = require("./visualAnalysis.service");

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

  const visualAnalysis =
    await analyzeVisualFrames({
      frameFiles,
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
    }) || [];

  const bestMatch =
    matches.length > 0
      ? matches[0]
      : null;

  return {
    signals,
    visualAnalysis,
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