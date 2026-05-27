const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,

  createdAt: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
  },

  mediaUrl: String,
  mediaType: String,

  reactions: [
    {
      userId: String,
      emoji: String
    }
  ],

  deleted: {
    type: Boolean,
    default: false
  },

  replyToId: String,
  replyToText: String
});

module.exports = mongoose.model("Message", MessageSchema);