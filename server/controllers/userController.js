const User = require("../models/User");

exports.upsertUser = async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      photoURL,
      username,
      profilePic,
      bio
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
        username: uname,
        profilePic,
        bio
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
      "uid name photoURL username isOnline lastSeen"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "server error"
    });
  }
};