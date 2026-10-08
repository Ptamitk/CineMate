const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentId: { type: Number, required: true },
    contentType: { type: String, enum: ["movie", "tv"], required: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    year: { type: String, default: "" },
    rating: { type: String, default: "" },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, contentId: 1, contentType: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Favorite", favoriteSchema);
