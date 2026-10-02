const fs = require("fs");
const { pipeline } = require("@huggingface/transformers");

let imageToTextPipeline = null;
let objectDetectionPipeline = null;

const getImageToTextPipeline = async () => {
  if (!imageToTextPipeline) {
    imageToTextPipeline = await pipeline(
      "image-to-text",
      "Xenova/vit-gpt2-image-captioning"
    );
  }

  return imageToTextPipeline;
};

const getObjectDetectionPipeline = async () => {
  if (!objectDetectionPipeline) {
    objectDetectionPipeline = await pipeline(
      "object-detection",
      "Xenova/detr-resnet-50"
    );
  }

  return objectDetectionPipeline;
};

const analyzeVisualFrames = async ({
  frameFiles = [],
}) => {
  if (!Array.isArray(frameFiles)) {
    throw new Error("Frame files must be an array.");
  }

  if (frameFiles.length === 0) {
    return {
      framesAnalyzed: 0,
      visualSignals: [],
    };
  }

  const imageToText = await getImageToTextPipeline();
  const objectDetector = await getObjectDetectionPipeline();

  const visualSignals = [];

  for (const framePath of frameFiles) {
    if (!framePath || !fs.existsSync(framePath)) {
      console.warn(
        "Visual analysis frame not found:",
        framePath
      );
      continue;
    }

    try {
      const [
        captionResult,
        objectResult,
      ] = await Promise.all([
        imageToText(framePath),
        objectDetector(framePath, {
          threshold: 0.65,
        }),
      ]);

      const description =
        Array.isArray(captionResult) &&
        captionResult[0]?.generated_text
          ? captionResult[0].generated_text.trim()
          : "";

      const objects =
        Array.isArray(objectResult)
          ? objectResult
              .filter(
                (item) =>
                  item?.score >= 0.65 &&
                  item?.label
              )
              .map((item) => ({
                label: item.label,
                score: Number(
                  item.score.toFixed(4)
                ),
              }))
          : [];

      visualSignals.push({
        framePath,
        analyzed: true,
        description,
        objects,
        faces: [],
        visualEmbedding: null,
      });

      console.log(
        "VISION FRAME:",
        description
      );

      console.log(
        "VISION OBJECTS:",
        objects
      );
    } catch (error) {
      console.error(
        "Visual frame analysis error:",
        error.message
      );

      visualSignals.push({
        framePath,
        analyzed: false,
        description: "",
        objects: [],
        faces: [],
        visualEmbedding: null,
      });
    }
  }

  return {
    framesAnalyzed: visualSignals.length,
    visualSignals,
  };
};

module.exports = {
  analyzeVisualFrames,
};