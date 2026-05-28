const crypto = require("crypto");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

function inviteToken() {
  return crypto.randomBytes(10).toString("hex");
}

async function hydrateGroup(group) {
  const users = await User.find({ uid: { $in: group.members || [] } }).select("uid name username photoURL isOnline lastSeen");
  return {
    ...group.toObject(),
    memberProfiles: users
  };
}

function userRoom(uid) {
  return `user:${uid}`;
}

function groupRoom(groupId) {
  return `group:${groupId}`;
}

function toConversationPayload(group) {
  return {
    kind: "group",
    group,
    participant: {
      uid: group._id,
      name: group.title,
      username: "group",
      photoURL: group.avatarUrl,
      isGroup: true,
      members: group.members,
      admins: group.admins,
      description: group.description,
      inviteToken: group.inviteToken
    },
    lastMessage: group.lastMessage || "Group created",
    lastAt: group.updatedAt || group.createdAt || new Date(),
    unreadCount: 0
  };
}

function emitGroupSync(req, eventName, group) {
  const io = req.app.get("io");
  if (!io) return;

  const groupId = String(group._id);
  for (const uid of group.members || []) {
    io.in(userRoom(uid)).socketsJoin(groupRoom(groupId));
  }

  const payload = {
    group,
    conversation: toConversationPayload(group)
  };

  for (const uid of group.members || []) {
    io.to(userRoom(uid)).emit(eventName, payload);
  }
}

exports.createGroup = async (req, res) => {
  try {
    const members = [...new Set([req.body.createdBy, ...(req.body.members || [])].filter(Boolean))];
    const group = await Conversation.create({
      type: "group",
      title: req.body.title,
      description: req.body.description,
      avatarUrl: req.body.avatarUrl,
      bannerUrl: req.body.bannerUrl,
      createdBy: req.body.createdBy,
      admins: [req.body.createdBy],
      members,
      participants: members,
      inviteToken: inviteToken()
    });

    const hydrated = await hydrateGroup(group);
    emitGroupSync(req, "group:created", hydrated);
    res.status(201).json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ type: "group", members: req.params.uid }).sort({ updatedAt: -1 });
    res.json(await Promise.all(groups.map(hydrateGroup)));
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Conversation.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "group not found" });
    if (!group.admins.includes(req.body.uid)) return res.status(403).json({ error: "admin required" });

    ["title", "description", "avatarUrl", "bannerUrl", "settings"].forEach((key) => {
      if (req.body[key] !== undefined) group[key] = req.body[key];
    });

    await group.save();
    const hydrated = await hydrateGroup(group);
    emitGroupSync(req, "group:updated", hydrated);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const group = await Conversation.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "group not found" });
    if (!group.admins.includes(req.body.uid)) return res.status(403).json({ error: "admin required" });

    const members = new Set(group.members);
    for (const member of req.body.members || []) members.add(member);
    group.members = [...members];
    group.participants = group.members;
    await group.save();

    const hydrated = await hydrateGroup(group);
    emitGroupSync(req, "group:updated", hydrated);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const group = await Conversation.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "group not found" });
    if (req.body.uid !== req.params.memberId && !group.admins.includes(req.body.uid)) {
      return res.status(403).json({ error: "admin required" });
    }

    group.members = group.members.filter((uid) => uid !== req.params.memberId);
    group.participants = group.members;
    group.admins = group.admins.filter((uid) => uid !== req.params.memberId);
    await group.save();

    const hydrated = await hydrateGroup(group);
    emitGroupSync(req, "group:updated", hydrated);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Conversation.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "group not found" });
    if (group.createdBy !== req.body.uid) return res.status(403).json({ error: "owner required" });

    await Message.deleteMany({ conversationId: group.id });
    await group.deleteOne();
    const io = req.app.get("io");
    if (io) {
      for (const uid of group.members || []) {
        io.to(userRoom(uid)).emit("group:deleted", { groupId: group.id });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const group = await Conversation.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "group not found" });

    const exists = group.pinnedMessages.some((item) => item.messageId === req.body.messageId);
    group.pinnedMessages = exists
      ? group.pinnedMessages.filter((item) => item.messageId !== req.body.messageId)
      : [...group.pinnedMessages, { messageId: req.body.messageId, pinnedBy: req.body.uid }];

    await group.save();
    const hydrated = await hydrateGroup(group);
    emitGroupSync(req, "group:updated", hydrated);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};
