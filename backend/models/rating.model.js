const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentId: { type: Number, required: true },
    contentType: { type: String, enum: ["movie", "tv"], required: true },
    value: { type: Number, required: true, min: 0.5, max: 10 },
  },
  { timestamps: true }
);

ratingSchema.index({ user: 1, contentId: 1, contentType: 1 }, { unique: true });
ratingSchema.index({ contentId: 1, contentType: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
