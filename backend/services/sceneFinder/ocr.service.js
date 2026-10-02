const Tesseract = require("tesseract.js");

const extractTextFromImage = async (
imagePath
) => {
if (!imagePath) {
throw new Error(
"Image path is required for OCR."
);
}

const result =
await Tesseract.recognize(
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
}
);

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
