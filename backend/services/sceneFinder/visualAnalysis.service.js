const fs = require("fs");
const { pipeline } = require("@huggingface/transformers");

let imageToTextPipeline = null;

const getImageToTextPipeline = async () => {
  if (!imageToTextPipeline) {
    imageToTextPipeline = await pipeline(
      "image-to-text",
      "Xenova/vit-gpt2-image-captioning"
    );
  }

  return imageToTextPipeline;
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

  /*
   * Scene matching currently uses the generated visual
   * description, not object detections. Loading DETR added
   * another large model and significant memory pressure without
   * contributing to the final score.
   */
  const imageToText = await getImageToTextPipeline();

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
      const captionResult = await imageToText(framePath);

      const description =
        Array.isArray(captionResult) &&
        captionResult[0]?.generated_text
          ? captionResult[0].generated_text.trim()
          : "";

      visualSignals.push({
        framePath,
        analyzed: true,
        description,
        objects: [],
        faces: [],
        visualEmbedding: null,
      });

      console.log(
        "VISION FRAME:",
        description
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
