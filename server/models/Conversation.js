const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["direct", "group"],
    default: "direct"
  },

  participants: [String],

  title: String,
  description: String,
  avatarUrl: String,
  bannerUrl: String,
  createdBy: String,
  admins: [String],
  members: [String],
  inviteToken: {
    type: String,
    index: true
  },
  settings: {
    onlyAdminsCanPost: { type: Boolean, default: false },
    onlyAdminsCanInvite: { type: Boolean, default: false },
    notifications: { type: String, default: "all" }
  },
  pinnedMessages: [
    {
      messageId: String,
      pinnedBy: String,
      pinnedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

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
