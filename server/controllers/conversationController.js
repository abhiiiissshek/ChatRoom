const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res) => {
  try {
    const uid = req.params.uid;

    const convs = await Conversation.find({
      participants: uid
    }).sort({
      updatedAt: -1
    });

    const out = [];

    for (const c of convs) {
      const otherUid = c.participants.find(
        (x) => x !== uid
      );

      const user = await User.findOne({
        uid: otherUid
      }).select(
        "uid name photoURL username isOnline lastSeen"
      );

      const unreadCount =
        await Message.countDocuments({
          from: otherUid,
          to: uid,
          status: {
            $ne: "seen"
          }
        });

      const lastMsg = await Message.findOne({
        $or: [
          { from: uid, to: otherUid },
          { from: otherUid, to: uid }
        ]
      }).sort({
        createdAt: -1
      });

      out.push({
        participant: user,

        lastMessage:
          lastMsg?.text ||
          (lastMsg?.mediaUrl
            ? "[media]"
            : c.lastMessage),

        lastAt:
          lastMsg?.createdAt ||
          c.updatedAt,

        unreadCount
      });
    }

    res.json(out);
  } catch (err) {
    res.status(500).json({
      error: "server error"
    });
  }
};