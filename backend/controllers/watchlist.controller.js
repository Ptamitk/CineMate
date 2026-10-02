
const Watchlist = require("../models/watchlist.model");

const getMyWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({
      user: req.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      watchlist,
    });
  } catch (error) {
    console.error(
      "Get Watchlist Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching your watchlist.",
    });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const {
      contentId,
      contentType,
      title,
      image,
      year,
      rating,
    } = req.body;

    if (
      !contentId ||
      !contentType ||
      !title
    ) {
      return res.status(400).json({
        message:
          "Content ID, type and title are required.",
      });
    }

    if (
      contentType !== "movie" &&
      contentType !== "tv"
    ) {
      return res.status(400).json({
        message:
          "Content type must be movie or tv.",
      });
    }

    const existingItem =
      await Watchlist.findOne({
        user: req.userId,
        contentId,
        contentType,
      });

    if (existingItem) {
      return res.status(409).json({
        message:
          "This content is already in your watchlist.",
      });
    }

    const watchlistItem =
      await Watchlist.create({
        user: req.userId,
        contentId,
        contentType,
        title: title.trim(),
        image: image || "",
        year: year || "",
        rating: rating || "",
      });

    return res.status(201).json({
      message:
        "Added to watchlist successfully.",
      item: watchlistItem,
    });
  } catch (error) {
    console.error(
      "Add Watchlist Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while adding to your watchlist.",
    });
  }
};

const removeFromWatchlist = async (
  req,
  res
) => {
  try {
    const {
      contentId,
      contentType,
    } = req.params;

    const deletedItem =
      await Watchlist.findOneAndDelete({
        user: req.userId,
        contentId: Number(contentId),
        contentType,
      });

    if (!deletedItem) {
      return res.status(404).json({
        message:
          "Content not found in your watchlist.",
      });
    }

    return res.status(200).json({
      message:
        "Removed from watchlist successfully.",
    });
  } catch (error) {
    console.error(
      "Remove Watchlist Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while removing from your watchlist.",
    });
  }
};

module.exports = {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};

