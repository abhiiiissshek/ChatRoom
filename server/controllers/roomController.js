const crypto = require("crypto");
const Room = require("../models/Room");

function token(size = 10) {
  return crypto.randomBytes(size).toString("hex");
}

exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create({
      roomId: token(8),
      inviteToken: token(12),
      title: req.body.title || "Instant meeting",
      type: req.body.type || "temporary",
      createdBy: req.body.createdBy
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.getRoomByInvite = async (req, res) => {
  try {
    const room = await Room.findOne({ inviteToken: req.params.token, active: true });
    if (!room) return res.status(404).json({ error: "room not found" });

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};

exports.endRoom = async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      { active: false, endedAt: new Date() },
      { new: true }
    );

    if (!room) return res.status(404).json({ error: "room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
};
