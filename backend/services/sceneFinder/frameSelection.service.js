
const selectUsefulFrames = ({
  frameFiles = [],
  maxFrames = 10,
}) => {
  if (!Array.isArray(frameFiles)) {
    throw new Error(
      "Frame files must be an array."
    );
  }

  if (frameFiles.length === 0) {
    return [];
  }

  /*
    If the video already has fewer frames
    than the limit, use all of them.
  */

  if (frameFiles.length <= maxFrames) {
    return frameFiles;
  }

  /*
    Select frames evenly across the
    complete video.

    Example:

    30 frames
    maxFrames = 10

    -> roughly every 3rd frame
  */

  const selectedFrames = [];
  const step =
    (frameFiles.length - 1) /
    (maxFrames - 1);

  for (
    let index = 0;
    index < maxFrames;
    index++
  ) {
    const frameIndex =
      Math.round(index * step);

    const frame =
      frameFiles[frameIndex];

    if (
      frame &&
      !selectedFrames.includes(frame)
    ) {
      selectedFrames.push(frame);
    }
  }

  return selectedFrames;
};

module.exports = {
  selectUsefulFrames,
};

