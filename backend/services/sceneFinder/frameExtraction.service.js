const fs = require("fs");
const path = require("path");
const os = require("os");

const {
runFFmpeg,
} = require("./ffmpeg.service");

const {
getVideoDuration,
} = require("./videoDuration.service");

const extractFrames = async ({
videoPath,
intervalSeconds = 1,
maxFrames = 30,
ocrFrameCount = 10,
}) => {
if (!videoPath) {
throw new Error(
"Video path is required for frame extraction."
);
}

if (!fs.existsSync(videoPath)) {
throw new Error(
"Video file was not found."
);
}

const outputDirectory =
await fs.promises.mkdtemp(
path.join(
os.tmpdir(),
"cinemate-scene-"
)
);

const outputPattern =
path.join(
outputDirectory,
"frame-%04d.jpg"
);

const duration =
await getVideoDuration(
videoPath
);

console.log(
`Video duration: ${duration.toFixed(
      2
    )} seconds`
);

const calculatedInterval =
duration / maxFrames;

const effectiveInterval =
Math.max(
0.5,
calculatedInterval
);

console.log(
`Frame interval: ${effectiveInterval.toFixed(
      2
    )} seconds`
);

await runFFmpeg([
"-i",
videoPath,
"-vf",
`fps=1/${effectiveInterval}`,
"-q:v",
"2",
"-frames:v",
String(maxFrames),
outputPattern,
]);

const files =
await fs.promises.readdir(
outputDirectory
);

const frameFiles =
files
.filter((file) =>
/^frame-\d+.jpg$/i.test(
file
)
)
.sort((a, b) => {
const aNumber =
Number(
a.match(/\d+/)?.[0] || 0
);


    const bNumber =
      Number(
        b.match(/\d+/)?.[0] || 0
      );

    return (
      aNumber - bNumber
    );
  })
  .map((file) =>
    path.join(
      outputDirectory,
      file
    )
  );


console.log(
`Frames extracted: ${frameFiles.length}`
);

/*
Select evenly distributed frames
for OCR.


Example:

30 extracted
      ↓
10 selected

This gives OCR coverage across
the entire video instead of only
analyzing the beginning.


*/

const targetCount =
Math.min(
ocrFrameCount,
frameFiles.length
);

let selectedFrameFiles =
frameFiles;

if (
frameFiles.length >
targetCount
) {
selectedFrameFiles =
Array.from(
{
length: targetCount,
},
(_, index) => {
const position =
Math.round(
(index *
(frameFiles.length -
1)) /
(targetCount -
1)
);


      return frameFiles[
        position
      ];
    }
  );


}

console.log(
`Frames selected for OCR: ${selectedFrameFiles.length}`
);

return {
outputDirectory,


frameFiles:
  selectedFrameFiles,

totalFrames:
  frameFiles.length,

selectedFrames:
  selectedFrameFiles.length,


};
};

module.exports = {
extractFrames,
};
