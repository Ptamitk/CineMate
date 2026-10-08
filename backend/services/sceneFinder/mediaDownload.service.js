const fs = require("fs");
const path = require("path");
const os = require("os");
const dns = require("dns").promises;
const net = require("net");

const MAX_MEDIA_BYTES = Math.max(
  5 * 1024 * 1024,
  Number(process.env.SCENE_FINDER_MAX_MEDIA_BYTES || 100 * 1024 * 1024)
);

const DOWNLOAD_TIMEOUT_MS = Math.max(
  10_000,
  Number(process.env.SCENE_FINDER_DOWNLOAD_TIMEOUT_MS || 60_000)
);


const isPrivateAddress = (address) => {
  if (!address) return true;
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:");
  }
  return true;
};

const assertPublicHost = async (hostname) => {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Private media hosts are not allowed.");
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("Private media hosts are not allowed.");
  }
};

const isVideoContentType = (value = "") => {
  const type = value.split(";")[0].trim().toLowerCase();
  return type.startsWith("video/") ||
    type === "application/octet-stream";
};

const downloadMediaFile = async (mediaUrl) => {
  if (!mediaUrl) {
    throw new Error("Media URL is required for download.");
  }

  let url;
  try {
    url = new URL(mediaUrl);
  } catch {
    throw new Error("Invalid media URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP(S) media URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DOWNLOAD_TIMEOUT_MS
  );

  let response;
  let outputDirectory;
  let fileHandle = null;

  try {
    await assertPublicHost(url.hostname);

    let currentUrl = url;
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      await assertPublicHost(currentUrl.hostname);
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "CineMate-SceneFinder/2.0",
          Accept: "video/*,application/octet-stream;q=0.9,*/*;q=0.1",
        },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location) throw new Error("Media server returned an invalid redirect.");
      currentUrl = new URL(location, currentUrl);
      if (!["http:", "https:"].includes(currentUrl.protocol)) {
        throw new Error("Only HTTP(S) media URLs are supported.");
      }
      if (redirect === 3) throw new Error("Too many media redirects.");
    }
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new Error("Video download timed out.", { cause: error });
    }
    throw error;
  }

  if (!response.ok) {
    clearTimeout(timeout);
    throw new Error(`Media download failed: ${response.status}`);
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!isVideoContentType(contentType)) {
    clearTimeout(timeout);
    throw new Error(
      "The supplied URL did not return a supported video file."
    );
  }

  const contentLength = Number(
    response.headers.get("content-length") || 0
  );

  if (contentLength > MAX_MEDIA_BYTES) {
    clearTimeout(timeout);
    throw new Error(
      "Video exceeds the configured processing limit."
    );
  }

  if (!response.body) {
    clearTimeout(timeout);
    throw new Error("Media download returned an empty response body.");
  }

  outputDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "cinemate-reel-")
  );

  const extension =
    contentType.includes("webm") ? ".webm" :
    contentType.includes("quicktime") ? ".mov" :
    contentType.includes("matroska") ? ".mkv" :
    ".mp4";

  const outputPath = path.join(
    outputDirectory,
    `scene-input${extension}`
  );

  try {
    fileHandle = await fs.promises.open(outputPath, "w");
    const reader = response.body.getReader();
    let totalBytes = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_MEDIA_BYTES) {
        await reader.cancel();
        throw new Error(
          "Video exceeds the 100 MB processing limit."
        );
      }

      await fileHandle.write(Buffer.from(value));
    }

    await fileHandle.close();
    fileHandle = null;

    if (!totalBytes) {
      throw new Error("Downloaded video is empty.");
    }

    console.log(
      "Scene Finder V2 media downloaded:",
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

    await fs.promises.rm(outputDirectory, {
      recursive: true,
      force: true,
    }).catch(() => {});

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  downloadMediaFile,
};