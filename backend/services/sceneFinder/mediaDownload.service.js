const fs = require("fs");
const path = require("path");
const os = require("os");

const MAX_MEDIA_BYTES =
  100 * 1024 * 1024;

const downloadMediaFile = async (
  mediaUrl
) => {
  if (!mediaUrl) {
    throw new Error(
      "Media URL is required for download."
    );
  }

  const response = await fetch(mediaUrl);

  if (!response.ok) {
    throw new Error(
      `Media download failed: ${response.status}`
    );
  }

  const contentLength = Number(
    response.headers.get("content-length") || 0
  );

  if (
    contentLength &&
    contentLength > MAX_MEDIA_BYTES
  ) {
    throw new Error(
      "Reel media exceeds the 100 MB processing limit."
    );
  }

  if (!response.body) {
    throw new Error(
      "Media download returned an empty response body."
    );
  }

  const outputDirectory =
    await fs.promises.mkdtemp(
      path.join(
        os.tmpdir(),
        "cinemate-reel-"
      )
    );

  const outputPath = path.join(
    outputDirectory,
    "reel-video.mp4"
  );

  let totalBytes = 0;
  let fileHandle = null;

  try {
    fileHandle =
      await fs.promises.open(
        outputPath,
        "w"
      );

    const reader =
      response.body.getReader();

    while (true) {
      const { value, done } =
        await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (
        totalBytes > MAX_MEDIA_BYTES
      ) {
        await reader.cancel();

        throw new Error(
          "Reel media exceeds the 100 MB processing limit."
        );
      }

      await fileHandle.write(
        Buffer.from(value)
      );
    }

    await fileHandle.close();
    fileHandle = null;

    if (totalBytes === 0) {
      throw new Error(
        "Downloaded Reel media is empty."
      );
    }

    console.log(
      "Reel video downloaded:",
      outputPath,
      `(${totalBytes} bytes)`
    );

    return {
      outputDirectory,
      videoPath: outputPath,
    };
  } catch (error) {
    if (fileHandle) {
      await fileHandle.close().catch(() => {});
    }

    await fs.promises.rm(
      outputDirectory,
      {
        recursive: true,
        force: true,
      }
    ).catch(() => {});

    throw error;
  }
};

module.exports = {
  downloadMediaFile,
};
