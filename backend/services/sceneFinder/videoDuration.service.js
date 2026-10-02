
const { spawn } = require("child_process");

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  String.raw`C:\Users\ptami\Downloads\ffmpeg-9.0.2-essentials_build\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe`;

const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn(
      FFMPEG_PATH,
      ["-i", videoPath],
      {
        windowsHide: true,
      }
    );

    let stderr = "";

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", () => {
      const match = stderr.match(
        /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/
      );

      if (!match) {
        reject(
          new Error(
            "Could not determine video duration."
          )
        );
        return;
      }

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const seconds = Number(match[3]);

      const duration =
        hours * 3600 +
        minutes * 60 +
        seconds;

      resolve(duration);
    });
  });
};

module.exports = {
  getVideoDuration,
};

