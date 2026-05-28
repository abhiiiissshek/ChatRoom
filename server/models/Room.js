const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    uid: String,
    name: String,
    photoURL: String,
    socketId: String,
    muted: { type: Boolean, default: false },
    cameraOff: { type: Boolean, default: false },
    screenSharing: { type: Boolean, default: false },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    inviteToken: { type: String, required: true, unique: true, index: true },
    title: String,
    type: {
      type: String,
      enum: ["private", "group", "temporary"],
      default: "temporary"
    },
    createdBy: String,
    active: {
      type: Boolean,
      default: true
    },
    participants: [ParticipantSchema],
    chat: [
      {
        from: String,
        name: String,
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    endedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
