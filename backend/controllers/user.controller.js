
const User = require("../models/user.model");


const {
  uploadToCloudinary,
} = require("../utils/cloudinaryUpload");



const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get My Profile Error:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching your profile.",
    });
  }
};


const updateMyProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (
      name !== undefined &&
      (!name.trim() || name.trim().length < 2)
    ) {
      return res.status(400).json({
        message: "Name must be at least 2 characters.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (req.file) {
      const uploadResult =
        await uploadToCloudinary(
          req.file.buffer
        );

      user.profilePicture =
        uploadResult.secure_url;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture,
        isEmailVerified:
          user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Update My Profile Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while updating your profile.",
    });
  }
};





module.exports = {
  getMyProfile,
   updateMyProfile,
};

