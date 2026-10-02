
const mongoose = require("mongoose");

const sceneFinderJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reelUrl: {
      type: String,
      default: "",
      trim: true,
    },

    videoPath: {
      type: String,
      default: "",
      trim: true,
    },


    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    result: {
      contentId: {
        type: Number,
        default: null,
      },

      contentType: {
        type: String,
        default: null,
      },

      title: {
        type: String,
        default: "",
      },

      year: {
        type: String,
        default: "",
      },

      rating: {
        type: String,
        default: "",
      },

      image: {
        type: String,
        default: "",
      },

      confidence: {
        type: Number,
        default: null,
      },
    },

    error: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const SceneFinderJob = mongoose.model(
  "SceneFinderJob",
  sceneFinderJobSchema
);

module.exports = SceneFinderJob;

