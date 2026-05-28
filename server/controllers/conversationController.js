const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res) => {
  try {
    const uid = req.params.uid;

    const convs = await Conversation.find({
      $or: [{ participants: uid }, { members: uid }]
    }).sort({ updatedAt: -1 });

    const out = [];

    for (const c of convs) {
      if (c.type === "group") {
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          from: { $ne: uid },
          status: { $ne: "seen" }
        });

        const lastMsg = await Message.findOne({
          conversationId: c.id
        }).sort({ createdAt: -1 });

        out.push({
          kind: "group",
          group: {
            ...c.toObject(),
            _id: c._id.toString(),
          },

          participant: {
            uid: c._id.toString(),
            name: c.title,
            username: "group",
            photoURL: c.avatarUrl || "",
            isGroup: true,
            members: c.members || [],
            admins: c.admins || [],
            description: c.description || "",
            inviteToken: c.inviteToken || "",
          },

          lastMessage:
            lastMsg?.text ||
            (lastMsg?.mediaUrl
              ? "[media]"
              : c.lastMessage || "Group created"),

          lastAt:
            lastMsg?.createdAt ||
            c.updatedAt ||
            c.createdAt,

          unreadCount: unreadCount || 0,
        });
        continue;
      }

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
