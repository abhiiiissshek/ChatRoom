const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { u1, u2 } = req.params;

    const msgs = await Message.find({
      $or: [
        { from: u1, to: u2 },
        { from: u2, to: u1 }
      ]
    }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    res.status(500).json({
      error: "server error"
    });
  }
};

exports.uploadMedia = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "no file"
    });
  }

  const url =
    `${req.protocol}://${req.get("host")}` +
    `/uploads/${req.file.filename}`;

  res.json({
    url,
    mediaType: req.file.mimetype
  });
};