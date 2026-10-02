const fs = require("fs");
const path = require("path");
const os = require("os");

const TEMP_ROOT = path.resolve(os.tmpdir());
const ALLOWED_DIRECTORY_PREFIXES = [
  path.join(TEMP_ROOT, "cinemate-scene-"),
  path.join(TEMP_ROOT, "cinemate-audio-"),
  path.join(TEMP_ROOT, "cinemate-reel-"),
];

const UPLOAD_DIRECTORY = path.resolve(
  path.join(TEMP_ROOT, "cinemate-scene-uploads")
);

const isInside = (targetPath, allowedPath) => {
  const relative = path.relative(
    allowedPath,
    targetPath
  );

  return (
    relative === "" ||
    (!relative.startsWith("..") &&
      !path.isAbsolute(relative))
  );
};

const isSafeFilePath = (filePath) => {
  if (!filePath) {
    return false;
  }

  const resolved = path.resolve(filePath);

  return (
    isInside(resolved, UPLOAD_DIRECTORY) ||
    ALLOWED_DIRECTORY_PREFIXES.some((prefix) =>
      isInside(resolved, prefix)
    )
  );
};

const isSafeDirectoryPath = (directoryPath) => {
  if (!directoryPath) {
    return false;
  }

  const resolved = path.resolve(directoryPath);

  return ALLOWED_DIRECTORY_PREFIXES.some((prefix) =>
    isInside(resolved, prefix)
  );
};

const removeFile = async (filePath) => {
  if (!isSafeFilePath(filePath)) {
    if (filePath) {
      console.warn(
        "Skipped unsafe Scene Finder file cleanup:",
        filePath
      );
    }
    return;
  }

  try {
    await fs.promises.unlink(filePath);
    console.log("Deleted file:", filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "File cleanup error:",
        error.message
      );
    }
  }
};

const removeDirectory = async (directoryPath) => {
  if (!isSafeDirectoryPath(directoryPath)) {
    if (directoryPath) {
      console.warn(
        "Skipped unsafe Scene Finder directory cleanup:",
        directoryPath
      );
    }
    return;
  }

  try {
    await fs.promises.rm(directoryPath, {
      recursive: true,
      force: true,
    });

    console.log(
      "Deleted directory:",
      directoryPath
    );
  } catch (error) {
    console.error(
      "Directory cleanup error:",
      error.message
    );
  }
};

const cleanupSceneFiles = async ({
  uploadedVideo = null,
  frameDirectory = null,
  audioDirectory = null,
} = {}) => {
  await Promise.allSettled([
    removeFile(uploadedVideo),
    removeDirectory(frameDirectory),
    removeDirectory(audioDirectory),
  ]);
};

module.exports = {
  cleanupSceneFiles,
};
