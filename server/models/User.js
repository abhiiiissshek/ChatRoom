const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    photoURL: String,
    username: String,
    profilePic: String,
    bio: String,
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);