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
const signals = {
ocr: {
text: "",
confidence: 0,
framesProcessed: 0,
},


speech: {
  text: "",
},


};

// OCR analysis
if (frameFiles.length > 0) {
const ocrResult =
await extractTextFromFrames(
frameFiles
);


const averageConfidence =
  ocrResult.results.length > 0
    ? ocrResult.results.reduce(
        (sum, item) =>
          sum + (item.confidence || 0),
        0
      ) / ocrResult.results.length
    : 0;

signals.ocr = {
  text:
    ocrResult.combinedText || "",
  confidence:
    averageConfidence,
  framesProcessed:
    ocrResult.framesProcessed,
};


}

// Speech-to-text analysis
if (audioPath) {
const speechResult =
await transcribeAudio(
audioPath
);


signals.speech = {
  text:
    speechResult.text || "",
};


}

return signals;
};

module.exports = {
analyzeSceneSignals,
};
