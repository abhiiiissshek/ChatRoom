const User = require("../models/User");

exports.upsertUser = async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      photoURL,
      bannerURL,
      username,
      profilePic,
      bio,
      about,
      privacy,
      notificationPreferences,
      blockedUsers
    } = req.body;

    if (!uid) {
      return res.status(400).json({
        error: "uid required"
      });
    }

    const uname = (
      username ||
      name ||
      email ||
      uid
    ).toLowerCase();

    const user = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        name,
        email,
        photoURL,
        bannerURL,
        username: uname,
        profilePic,
        bio,
        about,
        privacy,
        notificationPreferences,
        blockedUsers
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json(user);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "server error"
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const q = (
      req.query.search || ""
    ).toLowerCase();

    if (!q) return res.json([]);

    const users = await User.find({
      username: {
        $regex: q,
        $options: "i"
      }
    }).select(
      "uid name photoURL bannerURL username bio isOnline lastSeen"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "server error"
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const uid = req.params.uid;
    const allowed = [
      "name",
      "photoURL",
      "bannerURL",
      "profilePic",
      "bio",
      "about",
      "privacy",
      "notificationPreferences",
      "blockedUsers"
    ];

    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    const user = await User.findOneAndUpdate(
      { uid },
      patch,
      { new: true }
    ).select("-email");

    if (!user) {
      return res.status(404).json({
        error: "user not found"
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "server error"
    });
  }
};
