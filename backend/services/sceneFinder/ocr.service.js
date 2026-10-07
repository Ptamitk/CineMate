const Tesseract = require("tesseract.js");

const clean = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .replace(/[|]+/g, " ")
    .trim();

const runOcr = async (imagePath, pageSegMode) => {
  const result = await Tesseract.recognize(
    imagePath,
    "eng",
    {
      logger: (info) => {
        if (info.status === "recognizing text") {
          console.log(
            `OCR Progress (PSM ${pageSegMode}): ${Math.round(
              (info.progress || 0) * 100
            )}%`
          );
        }
      },
      tessedit_pageseg_mode: pageSegMode,
      preserve_interword_spaces: "1",
    }
  );

  return {
    text: clean(result.data.text || ""),
    confidence: Number(result.data.confidence || 0),
  };
};

const extractTextFromImage = async (imagePath) => {
  if (!imagePath) {
    throw new Error("Image path is required for OCR.");
  }

  // PSM 11 is substantially cheaper for subtitle/title-card style text.
  // Only run the heavier PSM 6 fallback when the first pass found little
  // or low-confidence text.
  const configuredModes = String(
    process.env.SCENE_FINDER_OCR_PSM_MODES || "11,6"
  )
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  const modes = configuredModes.length ? configuredModes : [11, 6];
  const firstMode = modes[0];
  const fallbackMode = modes[1];

  const timeoutMs = Math.max(
    8 * 1000,
    Number(process.env.SCENE_FINDER_OCR_TIMEOUT_MS || 45 * 1000)
  );

  const result = await Promise.race([
    (async () => {
      let first = null;

      try {
        first = await runOcr(imagePath, firstMode);
      } catch (error) {
        console.error(
          `OCR pass PSM ${firstMode} failed:`,
          error.message
        );
      }

      const usefulFirst =
        first &&
        first.text &&
        first.text.length >= 4 &&
        Number(first.confidence || 0) >= 35;

      if (usefulFirst || !fallbackMode) {
        return first || { text: "", confidence: 0 };
      }

      try {
        const fallback = await runOcr(imagePath, fallbackMode);
        const firstConfidence = Number(first?.confidence || 0);
        const fallbackConfidence = Number(fallback?.confidence || 0);

        return fallbackConfidence > firstConfidence ? fallback : first;
      } catch (error) {
        console.error(
          `OCR fallback PSM ${fallbackMode} failed:`,
          error.message
        );
        return first || { text: "", confidence: 0 };
      }
    })(),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`OCR timed out after ${timeoutMs} ms.`)),
        timeoutMs
      );
    }),
  ]);

  return result;
};
module.exports = {
  extractTextFromImage,
};