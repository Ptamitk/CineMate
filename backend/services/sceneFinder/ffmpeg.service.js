const { spawn } = require("child_process");

const FFMPEG_PATH =
process.env.FFMPEG_PATH ||
String.raw`C:\Users\ptami\Downloads\ffmpeg-9.0.2-essentials_build\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe`;

const runFFmpeg = (args = []) => {
return new Promise((resolve, reject) => {
const process = spawn(
FFMPEG_PATH,
args,
{
windowsHide: true,
}
);


let stderr = "";
let stdout = "";

process.stdout.on("data", (data) => {
  stdout += data.toString();
});

process.stderr.on("data", (data) => {
  stderr += data.toString();
});

process.on("error", (error) => {
  reject(error);
});

process.on("close", (code) => {
  if (code === 0) {
    resolve({
      stdout,
      stderr,
    });
    return;
  }

  reject(
    new Error(
      stderr ||
        `FFmpeg exited with code ${code}.`
    )
  );
});


});
};

module.exports = {
runFFmpeg,
};
