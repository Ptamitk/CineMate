const {
extractTextFromImage,
} = require("./ocr.service");

const OCR_CONCURRENCY = Math.max(
  1,
  Number(process.env.SCENE_FINDER_OCR_CONCURRENCY || 2)
);

const extractTextFromFrames = async (
frameFiles = []
) => {
if (!Array.isArray(frameFiles)) {
throw new Error(
"Frame files must be an array."
);
}

if (frameFiles.length === 0) {
return {
framesProcessed: 0,
combinedText: "",
results: [],
};
}

const results = new Array(
frameFiles.length
);

/*
Process only 3 frames at a time.


Example:
1, 2, 3  -> process
4, 5, 6  -> process
7, 8, 9  -> process
10       -> process


*/

for (
let start = 0;
start < frameFiles.length;
start += OCR_CONCURRENCY
) {
const batch =
frameFiles.slice(
start,
start + OCR_CONCURRENCY
);


const batchResults =
  await Promise.all(
    batch.map(
      async (
        framePath,
        batchIndex
      ) => {
        const resultIndex =
          start + batchIndex;

        try {
          console.log(
            "Running OCR on:",
            framePath
          );

          const ocrResult =
            await extractTextFromImage(
              framePath
            );

          return {
            resultIndex,
            result: {
              frame: framePath,
              text:
                ocrResult.text || "",
              confidence:
                ocrResult.confidence ||
                0,
            },
          };
        } catch (error) {
          console.error(
            "Frame OCR Error:",
            error.message
          );

          return {
            resultIndex,
            result: {
              frame: framePath,
              text: "",
              confidence: 0,
              error:
                error.message,
            },
          };
        }
      }
    )
  );

for (const item of batchResults) {
  results[item.resultIndex] =
    item.result;
}


}

const combinedText =
results
.map(
(item) => item?.text || ""
)
.filter(Boolean)
.join("\n");

return {
framesProcessed:
results.length,


combinedText,

results,


};
};

module.exports = {
extractTextFromFrames,
};