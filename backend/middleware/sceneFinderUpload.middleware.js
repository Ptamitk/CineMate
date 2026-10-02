const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

const uploadDirectory = path.join(
os.tmpdir(),
"cinemate-scene-uploads"
);

if (!fs.existsSync(uploadDirectory)) {
fs.mkdirSync(uploadDirectory, {
recursive: true,
});
}

const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, uploadDirectory);
},

filename: (req, file, cb) => {
const extension =
path.extname(file.originalname);


const filename = `scene-${Date.now()}${extension}`;

cb(null, filename);


},
});

const fileFilter = (
req,
file,
cb
) => {
const allowedTypes = [
"video/mp4",
"video/webm",
"video/quicktime",
"video/x-matroska",
];

if (
allowedTypes.includes(
file.mimetype
)
) {
cb(null, true);
return;
}

cb(
new Error(
"Only supported video files are allowed."
)
);
};

const sceneFinderUpload =
multer({
storage,
fileFilter,
limits: {
fileSize:
100 * 1024 * 1024,
},
});

module.exports =
sceneFinderUpload;
