const fs = require("fs");
const path = require("path");
const os = require("os");

const downloadMediaFile = async (
mediaUrl
) => {
if (!mediaUrl) {
throw new Error(
"Media URL is required for download."
);
}

const response = await fetch(
mediaUrl
);

if (!response.ok) {
throw new Error(
`Media download failed: ${response.status}`
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

const arrayBuffer =
await response.arrayBuffer();

await fs.promises.writeFile(
outputPath,
Buffer.from(arrayBuffer)
);

console.log(
"Reel video downloaded:",
outputPath
);

return {
outputDirectory,
videoPath: outputPath,
};
};

module.exports = {
downloadMediaFile,
};
