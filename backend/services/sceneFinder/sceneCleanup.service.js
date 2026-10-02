const fs = require("fs");
const path = require("path");
const os = require("os");

const SceneFinderJob = require("../../models/sceneFinderJob.model");

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

const cleanupStaleSceneTempFiles = async ({
  maxAgeMs = Math.max(
    60 * 60 * 1000,
    Number(
      process.env.SCENE_FINDER_TEMP_MAX_AGE_MS ||
        24 * 60 * 60 * 1000
    )
  ),
} = {}) => {
  const cutoff = Date.now() - maxAgeMs;

  let activeUploadPaths = new Set();

  try {
    const activeJobs =
      await SceneFinderJob.find({
        status: {
          $in: ["pending", "processing"],
        },
        videoPath: {
          $nin: ["", null],
        },
      })
        .select("videoPath")
        .lean();

    activeUploadPaths = new Set(
      activeJobs
        .map((job) =>
          job.videoPath
            ? path.resolve(job.videoPath)
            : null
        )
        .filter(Boolean)
    );
  } catch (error) {
    console.error(
      "Scene Finder stale cleanup lookup error:",
      error.message
    );
    return;
  }

  const removeIfStale = async (targetPath) => {
    try {
      const stats =
        await fs.promises.stat(targetPath);

      if (
        stats.mtimeMs > cutoff ||
        activeUploadPaths.has(
          path.resolve(targetPath)
        )
      ) {
        return;
      }

      if (
        stats.isFile() &&
        isSafeFilePath(targetPath)
      ) {
        await fs.promises.unlink(targetPath);
        console.log(
          "Deleted stale Scene Finder file:",
          targetPath
        );
        return;
      }

      if (
        stats.isDirectory() &&
        isSafeDirectoryPath(targetPath)
      ) {
        await fs.promises.rm(targetPath, {
          recursive: true,
          force: true,
        });
        console.log(
          "Deleted stale Scene Finder directory:",
          targetPath
        );
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "Stale Scene Finder cleanup error:",
          error.message
        );
      }
    }
  };

  try {
    const entries =
      await fs.promises.readdir(
        TEMP_ROOT,
        { withFileTypes: true }
      );

    for (const entry of entries) {
      const entryPath = path.join(
        TEMP_ROOT,
        entry.name
      );

      if (
        entry.isDirectory() &&
        entry.name ===
          path.basename(UPLOAD_DIRECTORY)
      ) {
        const uploadEntries =
          await fs.promises.readdir(
            entryPath,
            { withFileTypes: true }
          );

        for (const uploadEntry of uploadEntries) {
          await removeIfStale(
            path.join(
              entryPath,
              uploadEntry.name
            )
          );
        }

        continue;
      }

      if (
        ALLOWED_DIRECTORY_PREFIXES.some(
          (prefix) =>
            entryPath ===
              prefix ||
            entryPath.startsWith(
              prefix
            )
        )
      ) {
        await removeIfStale(entryPath);
      }
    }
  } catch (error) {
    console.error(
      "Scene Finder temp scan error:",
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
  cleanupStaleSceneTempFiles,
};
