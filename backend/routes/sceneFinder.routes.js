const express = require("express");

const {
analyzeScene,
getSceneAnalysisStatus,
} = require("../controllers/sceneFinder.controller");

const authMiddleware = require("../middleware/auth.middleware");

const sceneFinderUpload = require(
"../middleware/sceneFinderUpload.middleware"
);

const router = express.Router();

router.post(
"/analyze",
authMiddleware,
sceneFinderUpload.single("video"),
analyzeScene
);

router.get(
"/status/:jobId",
authMiddleware,
getSceneAnalysisStatus
);

module.exports = router;
