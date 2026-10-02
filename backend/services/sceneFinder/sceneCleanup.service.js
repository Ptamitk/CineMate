const fs = require("fs");
const path = require("path");

const removeFile = async (
filePath
) => {
if (!filePath) {
return;
}

try {
await fs.promises.unlink(
filePath
);


console.log(
  "Deleted file:",
  filePath
);


} catch (error) {
if (
error.code !==
"ENOENT"
) {
console.error(
"File cleanup error:",
error.message
);
}
}
};

const removeDirectory =
async (directoryPath) => {
if (!directoryPath) {
return;
}


try {
  await fs.promises.rm(
    directoryPath,
    {
      recursive: true,
      force: true,
    }
  );

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

const cleanupSceneFiles =
async ({
uploadedVideo = null,
frameDirectory = null,
audioDirectory = null,
} = {}) => {
await Promise.all([
removeFile(
uploadedVideo
),
removeDirectory(
frameDirectory
),
removeDirectory(
audioDirectory
),
]);
};

module.exports = {
cleanupSceneFiles,
};
