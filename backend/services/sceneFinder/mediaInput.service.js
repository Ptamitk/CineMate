const { getReelMediaInput } = require("./reelMedia.service");

const isInstagramUrl = (value = "") => {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    return (
      host === "instagram.com" ||
      host === "www.instagram.com" ||
      host === "m.instagram.com" ||
      host === "instagr.am" ||
      host === "www.instagr.am"
    );
  } catch {
    return false;
  }
};

const getMediaInput = async ({
  reelUrl,
  uploadedFile = null,
}) => {
  if (uploadedFile) {
    return {
      sourceType: "upload",
      source: uploadedFile.path || uploadedFile.location,
      mimeType: uploadedFile.mimetype || "",
      caption: "",
    };
  }

  const inputUrl = reelUrl?.trim() || "";

  if (!inputUrl) {
    throw new Error("Video file or video URL is required.");
  }

  if (isInstagramUrl(inputUrl)) {
    return getReelMediaInput(inputUrl);
  }

  return {
    sourceType: "media_url",
    source: inputUrl,
    mediaUrl: inputUrl,
    originalReelUrl: inputUrl,
    caption: "",
    readyForAnalysis: true,
  };
};

module.exports = {
  getMediaInput,
  isInstagramUrl,
};