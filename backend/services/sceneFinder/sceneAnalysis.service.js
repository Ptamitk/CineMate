const {
  analyzeSceneSignals,
} = require("./sceneSignals.service");

const {
  findSceneCandidates,
} = require("./sceneCandidate.service");

const {
  matchSceneCandidates,
} = require("./sceneMatcher.service");

const {
  analyzeVisualFrames,
} = require("./visualAnalysis.service");

const analyzeScene = async ({
  frameFiles = [],
  audioPath = null,
  caption = "",
}) => {
  console.log("Starting Scene Finder analysis...");

  const signals = await analyzeSceneSignals({
    frameFiles,
    audioPath,
  });

  console.log("Scene signals extracted.");

  console.log("OCR TEXT:", signals.ocr.text);
  console.log("SPEECH TEXT:", signals.speech.text);
  console.log("REEL CAPTION:", caption);
  console.log("CAPTION JSON:", JSON.stringify(caption));

  const visualAnalysis = await analyzeVisualFrames({
    frameFiles,
  });

  console.log(
    `Visual frames prepared: ${visualAnalysis.framesAnalyzed}`
  );

  const candidateResult = await findSceneCandidates({
    ocrText: signals.ocr.text,
    speechText: signals.speech.text,
    caption,
    visualAnalysis,
  });

  const candidates = candidateResult?.candidates || [];

  console.log(
    `Candidates found: ${candidates.length}`
  );

  const matches =
    matchSceneCandidates({
      ocrText: signals.ocr.text,
      speechText: signals.speech.text,
      caption,
      candidates,
      visualSignals: candidateResult?.visualSignals || [],
    }) || [];

  console.log(`Candidates scored: ${matches.length}`);

  console.log(
    "SCENE MATCHES:",
    matches.map((match) => ({
      title: match.title,
      contentType: match.contentType,
      confidence: match.confidence,
      sceneScore: match.sceneScore,
    }))
  );

  const bestMatch =
    matches.length > 0 ? matches[0] : null;

  if (bestMatch) {
    console.log(
      "FINAL SCENE MATCH:",
      {
        title: bestMatch.title,
        contentType: bestMatch.contentType,
        confidence: bestMatch.confidence,
      }
    );
  } else {
    console.log("FINAL SCENE MATCH: None");
  }

  return {
    signals,
    visualAnalysis,
    caption,
    queries: candidateResult?.queries || [],
    candidates: matches,
    bestMatch,
  };
};

module.exports = {
  analyzeScene,
};