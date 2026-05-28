const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    text: String,
    mediaUrl: String,
    mediaType: String,
    background: String,
    privacy: {
      type: String,
      enum: ["everyone", "contacts", "onlyMe", "custom"],
      default: "everyone"
    },
    allowedViewers: [String],
    seenBy: [
      {
        userId: String,
        seenAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    reactions: [
      {
        userId: String,
        emoji: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    replies: [
      {
        userId: String,
        text: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true
    }
  },
  { timestamps: true }
);

StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", StatusSchema);
