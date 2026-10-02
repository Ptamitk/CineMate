
const {
  getReelMediaInput,
} = require("./reelMedia.service");

const getMediaInput = async ({
  reelUrl,
  uploadedFile = null,
}) => {
  // Uploaded video has priority.
  if (uploadedFile) {
    return {
      sourceType: "upload",
      source:
        uploadedFile.path ||
        uploadedFile.location,
      mimeType:
        uploadedFile.mimetype || "",
    };
  }

  // Instagram Reel URL.
  if (reelUrl?.trim()) {
    return getReelMediaInput(
      reelUrl.trim()
    );
  }

  throw new Error(
    "No scene media input was provided."
  );
};

module.exports = {
  getMediaInput,
};

