const Status = require("../models/Status");
const User = require("../models/User");

function isVisible(status, viewerId) {
  if (status.userId === viewerId) return true;
  if (status.privacy === "onlyMe") return false;
  if (status.privacy === "custom") return status.allowedViewers.includes(viewerId);
  return true;
}

async function attachAuthors(statuses) {
  const userIds = [...new Set(statuses.map((status) => status.userId))];
  const users = await User.find({ uid: { $in: userIds } }).select("uid name username photoURL");
  const byId = new Map(users.map((user) => [user.uid, user]));

  return statuses.map((status) => ({
    ...status.toObject(),
    author: byId.get(status.userId) || { uid: status.userId, name: "User" }
  }));
}

function userRoom(uid) {
  return `user:${uid}`;
}

function emitStatusSync(req, eventName, status) {
  const io = req.app.get("io");
  if (!io) return;

  if (status.privacy === "onlyMe") {
    io.to(userRoom(status.userId)).emit(eventName, { status });
    return;
  }

  if (status.privacy === "custom") {
    const viewers = [...new Set([status.userId, ...(status.allowedViewers || [])])];
    for (const uid of viewers) io.to(userRoom(uid)).emit(eventName, { status });
    return;
  }

  io.emit(eventName, { status });
}

exports.getStatuses = async (req, res) => {
  try {
    const viewerId = req.query.viewerId;
    const now = new Date();

    const statuses = await Status.find({ expiresAt: { $gt: now } }).sort({ createdAt: 1 });
    const visible = statuses.filter((status) => isVisible(status, viewerId));
    const withAuthors = await attachAuthors(visible);

    res.json(withAuthors);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.createStatus = async (req, res) => {
  try {
    const payload = {
      userId: req.body.userId,
      text: req.body.text,
      mediaUrl: req.body.mediaUrl,
      mediaType: req.body.mediaType,
      background: req.body.background,
      privacy: req.body.privacy || "everyone",
      allowedViewers: req.body.allowedViewers || []
    };

    if (req.file) {
      payload.mediaUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      payload.mediaType = req.file.mimetype;
    }

    const status = await Status.create(payload);
    const [withAuthor] = await attachAuthors([status]);
    emitStatusSync(req, "status:created", withAuthor);
    res.status(201).json(withAuthor);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.markSeen = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { userId } = req.body;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ error: "not found" });

    if (!status.seenBy.some((item) => item.userId === userId)) {
      status.seenBy.push({ userId });
      await status.save();
    }

    const [withAuthor] = await attachAuthors([status]);
    emitStatusSync(req, "status:updated", withAuthor);
    res.json(withAuthor);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.reactToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { userId, emoji } = req.body;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ error: "not found" });

    status.reactions = status.reactions.filter((item) => item.userId !== userId);
    if (emoji) status.reactions.push({ userId, emoji });
    await status.save();

    const [withAuthor] = await attachAuthors([status]);
    emitStatusSync(req, "status:updated", withAuthor);
    res.json(withAuthor);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.replyToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { userId, text } = req.body;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ error: "not found" });

    status.replies.push({ userId, text });
    await status.save();

    const [withAuthor] = await attachAuthors([status]);
    emitStatusSync(req, "status:updated", withAuthor);
    res.json(withAuthor);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};
