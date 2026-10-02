const Tesseract = require("tesseract.js");

const OCR_TIMEOUT_MS = Math.max(
  10 * 1000,
  Number(
    process.env.SCENE_FINDER_OCR_TIMEOUT_MS ||
      60 * 1000
  )
);

const extractTextFromImage = async (
imagePath
) => {
if (!imagePath) {
throw new Error(
"Image path is required for OCR."
);
}

const result =
await Promise.race([
  Tesseract.recognize(
    imagePath,
"eng",
{
logger: (info) => {
if (
info.status ===
"recognizing text"
) {
console.log(
`OCR Progress: ${Math.round(
                (info.progress || 0) * 100
              )}%`
);
}
},
  ),
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `OCR timed out after ${OCR_TIMEOUT_MS} ms.`
        )
      );
    }, OCR_TIMEOUT_MS);
  }),
]);

return {
text:
result.data.text?.trim() || "",
confidence:
result.data.confidence || 0,
};
};

module.exports = {
extractTextFromImage,
};
