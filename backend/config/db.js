
const mongoose = require("mongoose");
const SceneFinderJob = require("../models/sceneFinderJob.model");

const syncSceneFinderIndexes = async () => {
  const indexes = await SceneFinderJob.collection
    .listIndexes()
    .toArray();

  const activeReelIndexes = indexes.filter(
    (index) =>
      index.unique === true &&
      index.key?.user === 1 &&
      index.key?.reelUrl === 1 &&
      index.name !== "scene_finder_active_reel_unique"
  );

  for (const index of activeReelIndexes) {
    await SceneFinderJob.collection.dropIndex(
      index.name
    );

    console.log(
      `Removed legacy Scene Finder index: ${index.name}`
    );
  }

  await SceneFinderJob.createIndexes();
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await syncSceneFinderIndexes();

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

