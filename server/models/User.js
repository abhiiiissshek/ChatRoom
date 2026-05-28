const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    photoURL: String,
    bannerURL: String,
    username: String,
    profilePic: String,
    bio: String,
    about: String,
    privacy: {
      lastSeen: { type: String, default: "contacts" },
      profilePhoto: { type: String, default: "everyone" },
      calls: { type: String, default: "everyone" },
      status: { type: String, default: "everyone" }
    },
    notificationPreferences: {
      muted: { type: Boolean, default: false },
      sounds: { type: Boolean, default: true },
      previews: { type: Boolean, default: true }
    },
    blockedUsers: [String],
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
