const {
  extractTextFromFrames,
} = require("./frameOcr.service");

const {
  transcribeAudio,
} = require("./speechToText.service");

const analyzeSceneSignals = async ({
  frameFiles = [],
  audioPath = null,
}) => {
  const ocrTask = frameFiles.length
    ? extractTextFromFrames(frameFiles)
    : Promise.resolve({ combinedText: "", results: [], framesProcessed: 0 });

  const speechTask = audioPath
    ? transcribeAudio(audioPath)
    : Promise.resolve({ text: "" });

  const [ocrResult, speechResult] = await Promise.all([
    ocrTask,
    speechTask,
  ]);

  const averageConfidence =
    ocrResult.results.length > 0
      ? ocrResult.results.reduce(
          (sum, item) => sum + (item.confidence || 0),
          0
        ) / ocrResult.results.length
      : 0;

  return {
    ocr: {
      text: ocrResult.combinedText || "",
      confidence: averageConfidence,
      framesProcessed: ocrResult.framesProcessed || 0,
      results: ocrResult.results || [],
    },
    speech: {
      text: speechResult.text || "",
    },
  };
};

module.exports = {
  analyzeSceneSignals,
};
