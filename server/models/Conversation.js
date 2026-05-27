const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: [String],

  lastMessage: String,

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Conversation",
  ConversationSchema
);