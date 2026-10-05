const Tesseract = require("tesseract.js");

const OCR_TIMEOUT_MS = Math.max(
  10 * 1000,
  Number(process.env.SCENE_FINDER_OCR_TIMEOUT_MS || 60 * 1000)
);

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

  const modes = String(
    process.env.SCENE_FINDER_OCR_PSM_MODES || "6,11"
  )
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));

  const timeoutMs = OCR_TIMEOUT_MS * Math.max(1, modes.length);

  const result = await Promise.race([
    (async () => {
      const passes = [];

      for (const mode of modes) {
        try {
          passes.push(await runOcr(imagePath, mode));
        } catch (error) {
          console.error(
            `OCR pass PSM ${mode} failed:`,
            error.message
          );
        }
      }

      const uniqueText = [];
      const seen = new Set();

      for (const pass of passes) {
        const normalized = clean(pass.text).toLowerCase();
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          uniqueText.push(pass.text);
        }
      }

      return {
        text: uniqueText.join(" "),
        confidence:
          passes.length > 0
            ? Math.max(...passes.map((pass) => pass.confidence))
            : 0,
      };
    })(),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(
          new Error(`OCR timed out after ${timeoutMs} ms.`)
        ),
        timeoutMs
      );
    }),
  ]);

  return result;
};

module.exports = {
  extractTextFromImage,
};