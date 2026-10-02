
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

    source: {
      type: String,
      enum: ["web", "telegram"],
      default: "web",
      index: true,
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

    processingStartedAt: {
      type: Date,
      default: null,
      index: true,
    },

    processingHeartbeatAt: {
      type: Date,
      default: null,
      index: true,
    },

    workerId: {
      type: String,
      default: "",
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

      sceneScore: {
        type: Number,
        default: null,
      },

      evidenceType: {
        type: String,
        default: "",
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

sceneFinderJobSchema.index(
  { user: 1, reelUrl: 1 },
  {
    unique: true,
    name: "scene_finder_active_reel_unique",
    partialFilterExpression: {
      status: {
        $in: ["pending", "processing"],
      },
      reelUrl: {
        $type: "string",
        $gt: "",
      },
    },
  }
);

const SceneFinderJob = mongoose.model(
  "SceneFinderJob",
  sceneFinderJobSchema
);

module.exports = SceneFinderJob;

