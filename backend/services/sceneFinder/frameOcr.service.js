const { extractTextFromImage } = require("./ocr.service");

const OCR_CONCURRENCY = Math.max(
  2,
  Math.min(4, Number(process.env.SCENE_FINDER_OCR_CONCURRENCY || 4))
);

const extractTextFromFrames = async (frameFiles = []) => {
  if (!Array.isArray(frameFiles)) {
    throw new Error("Frame files must be an array.");
  }

  if (!frameFiles.length) {
    return { framesProcessed: 0, combinedText: "", results: [] };
  }

  const results = new Array(frameFiles.length);

  for (let start = 0; start < frameFiles.length; start += OCR_CONCURRENCY) {
    const batch = frameFiles.slice(start, start + OCR_CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (framePath, batchIndex) => {
        const resultIndex = start + batchIndex;

        try {
          console.log("Running OCR on:", framePath);
          const ocrResult = await extractTextFromImage(framePath);

          return {
            resultIndex,
            result: {
              frame: framePath,
              text: ocrResult.text || "",
              confidence: ocrResult.confidence || 0,
            },
          };
        } catch (error) {
          console.error("Frame OCR Error:", error.message);
          return {
            resultIndex,
            result: {
              frame: framePath,
              text: "",
              confidence: 0,
              error: error.message,
            },
          };
        }
      })
    );

    for (const item of batchResults) results[item.resultIndex] = item.result;
  }

  return {
    framesProcessed: results.length,
    combinedText: results.map(item => item?.text || "").filter(Boolean).join("\n"),
    results,
  };
};

module.exports = { extractTextFromFrames };
