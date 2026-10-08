const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentId: { type: Number, required: true },
    contentType: { type: String, enum: ["movie", "tv"], required: true },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    body: { type: String, trim: true, required: true, maxlength: 5000 },
    spoiler: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ contentId: 1, contentType: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
