const { spawn } = require("child_process");

const FFMPEG_PATH =
  process.env.FFMPEG_PATH || "ffmpeg";

const FFMPEG_TIMEOUT_MS = Math.max(
  30 * 1000,
  Number(
    process.env.SCENE_FINDER_FFMPEG_TIMEOUT_MS ||
      5 * 60 * 1000
  )
);

const runFFmpeg = (
  args = [],
  { allowNonZeroExit = false } = {}
) => {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, {
      windowsHide: true,
    });

    let stderr = "";
    let stdout = "";
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };

    const timeout = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // Process may already have exited.
      }

      finish(
        reject,
        new Error(
          `FFmpeg timed out after ${FFMPEG_TIMEOUT_MS} ms.`
        )
      );
    }, FFMPEG_TIMEOUT_MS);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      finish(reject, error);
    });

    child.on("close", (code, signal) => {
      if (code === 0 || allowNonZeroExit) {
        finish(resolve, {
          code,
          signal,
          stdout,
          stderr,
        });
        return;
      }

      finish(
        reject,
        new Error(
          stderr ||
            `FFmpeg exited with code ${code}${signal ? ` (${signal})` : ""}.`
        )
      );
    });
  });
};

module.exports = {
  runFFmpeg,
  FFMPEG_TIMEOUT_MS,
};