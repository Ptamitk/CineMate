const SceneFinderJob = require("../models/sceneFinderJob.model");

const {
enqueueSceneFinderJob,
} = require("../services/sceneFinder/sceneJobQueue.service");

const analyzeScene = async (req, res) => {
try {
const { reelUrl } = req.body;


const uploadedVideo =
  req.file?.path || null;

if (!reelUrl?.trim() && !uploadedVideo) {
  return res.status(400).json({
    message:
      "Instagram Reel URL or video file is required.",
  });
}

const job = await SceneFinderJob.create({
  user: req.userId,
  reelUrl: reelUrl?.trim() || "",
  videoPath: uploadedVideo || "",
  status: "pending",
});

// Queue processing so heavy Scene Finder jobs are bounded.
enqueueSceneFinderJob(
  job._id.toString(),
  uploadedVideo
);

return res.status(201).json({
  message:
    "Scene analysis job created.",
  job: {
    id: job._id,
    status: job.status,
  },
});


} catch (error) {
console.error(
"Scene Finder Error:",
error.message
);


return res.status(500).json({
  message:
    "Something went wrong while creating the scene analysis job.",
});


}
};

const getSceneAnalysisStatus = async (
req,
res
) => {
try {
const { jobId } = req.params;


const job = await SceneFinderJob.findOne({
  _id: jobId,
  user: req.userId,
});

if (!job) {
  return res.status(404).json({
    message:
      "Scene analysis job not found.",
  });
}

return res.status(200).json({
  job: {
    id: job._id,
    status: job.status,
    result: job.result,
    error: job.error,
  },
});


} catch (error) {
console.error(
"Scene Finder Status Error:",
error.message
);


return res.status(500).json({
  message:
    "Something went wrong while fetching scene analysis status.",
});


}
};

module.exports = {
analyzeScene,
getSceneAnalysisStatus,
};
