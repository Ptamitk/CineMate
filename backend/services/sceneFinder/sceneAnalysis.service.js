const { analyzeSceneEvidence } = require("./sceneEvidence.service");

const analyzeScene = async ({
  frameFiles = [],
  ocrFrameFiles = [],
  audioPath = null,
  caption = "",
}) => {
  console.log("Starting Scene Finder V2 analysis...");

  const result = await analyzeSceneEvidence({
    frameFiles,
    ocrFrameFiles,
    audioPath,
    caption,
  });

  console.log("Scene Finder V2 analysis completed.");

  return result;
};

module.exports = {
  analyzeScene,
};