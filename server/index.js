// index.js — Full Latest Version (Conversations, Presence, Media, Reactions, Typing)
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// === ENV ===
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/simplechat";
const PORT = process.env.PORT || 4000;

const CLIENTS = [
  "http://localhost:5173", // Vite
  "http://localhost:3000"  // React CRA
];

// === APP + CORS ===
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: CLIENTS,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(bodyParser.json());

// === SOCKET.IO ===
const io = new Server(server, {
  cors: {
    origin: CLIENTS,
    credentials: true
  }
});

// === UPLOADS FOLDER ===
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// === Multer Storage ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({ storage });

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// === Mongoose Models ===
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    photoURL: String,
    username: String,
    profilePic: String,
    bio: String,
    isOnline: { type: Boolean, default: false },
    lastSeen: Date
  },
  { timestamps: true }
);

const MessageSchema = new Schema({
  from: String,
  to: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
  mediaUrl: String,
  mediaType: String,
  reactions: [{ userId: String, emoji: String }],
  deleted: { type: Boolean, default: false },
  replyToId: String,
  replyToText: String
});

const ConversationSchema = new Schema({
  participants: [String],
  lastMessage: String,
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);
const Conversation = mongoose.model("Conversation", ConversationSchema);

// ============================================================================
// API ENDPOINTS
// ============================================================================

// === UPSERT USER ===
app.post("/api/users/upsert", async (req, res) => {
  try {
    const { uid, name, email, photoURL, username, profilePic, bio } = req.body;
    if (!uid) return res.status(400).json({ error: "uid required" });

    const uname = (username || name || email || uid).toLowerCase();

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, name, email, photoURL, username: uname, profilePic, bio },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (err) {
    console.error("UPSERT USER ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// === Search Users ===
app.get("/api/users", async (req, res) => {
  try {
    const q = (req.query.search || "").toLowerCase();
    if (!q) return res.json([]);

    const results = await User.find({
      username: { $regex: q, $options: "i" }
    }).select("uid name photoURL username isOnline lastSeen");

    res.json(results);
  } catch (err) {
    console.error("SEARCH USERS ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// === Get Messages Between Two Users ===
app.get("/api/messages/:u1/:u2", async (req, res) => {
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
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// === Upload Media ===
app.post("/api/messages/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({
    url,
    mediaType: req.file.mimetype
  });
});

// ============================================================================
// NEW ENDPOINT — /api/conversations/:uid
// ============================================================================
app.get("/api/conversations/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const convs = await Conversation.find({ participants: uid })
      .sort({ updatedAt: -1 })
      .limit(50);

    const out = [];

    for (const c of convs) {
      const otherUid = c.participants.find((x) => x !== uid);

      const user = await User.findOne({ uid: otherUid }).select(
        "uid name photoURL username isOnline lastSeen"
      );

      const unreadCount = await Message.countDocuments({
        from: otherUid,
        to: uid,
        status: { $ne: "seen" }
      });

      const lastMsg = await Message.findOne({
        $or: [
          { from: uid, to: otherUid },
          { from: otherUid, to: uid }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(1);

      out.push({
        participant: user,
        lastMessage:
          lastMsg?.text || (lastMsg?.mediaUrl ? "[media]" : c.lastMessage),
        lastAt: lastMsg?.createdAt || c.updatedAt,
        unreadCount
      });
    }

    res.json(out);
  } catch (err) {
    console.error("CONVERSATIONS ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ============================================================================
// AI SUGGESTIONS ENDPOINT
// ============================================================================
app.post("/api/ai/suggest", async (req, res) => {
  try {
    const { messages } = req.body || {};
    const last = messages && messages.length ? messages[messages.length - 1].text || "" : "";

    // Simple heuristics: canned suggestions
    const suggestions = [
      "Sounds good — I'll handle that.",
      "Can you send more details?",
      "I can do that tomorrow — what time works?",
      "Thanks! I'll confirm and get back.",
      "Great idea — let's try that."
    ];

    if (/when|time|date/i.test(last)) {
      suggestions.unshift("When would you like to do it?");
    } else if (/thanks|thank/i.test(last)) {
      suggestions.unshift("You're welcome! 😊");
    } else if (/ok|sure|yes/i.test(last)) {
      suggestions.unshift("Perfect — I'll start now.");
    }

    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggest error", err);
    res.status(500).json({ error: "server error" });
  }
});

// ============================================================================
// SOCKET.IO REALTIME EVENTS
// ============================================================================
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED:", socket.id);

  socket.on("user_connected", async (uid) => {
    socket.uid = uid;
    onlineUsers.set(uid, socket.id);

    await User.findOneAndUpdate({ uid }, { isOnline: true });

    io.emit("presence_update", {
      userId: uid,
      isOnline: true,
      lastSeen: null
    });
  });

  // Typing
  socket.on("typing", ({ from, to }) => {
    const toSock = onlineUsers.get(to);
    if (toSock) io.to(toSock).emit("typing", { from });
  });

  socket.on("stop_typing", ({ from, to }) => {
    const toSock = onlineUsers.get(to);
    if (toSock) io.to(toSock).emit("stop_typing", { from });
  });

  // Private Message
  socket.on("private_message", async (data) => {
    try {
      const msg = new Message(data);
      await msg.save();

      const parts = [data.from, data.to].sort();

      await Conversation.findOneAndUpdate(
        { participants: parts },
        {
          participants: parts,
          lastMessage: data.text || (data.mediaUrl ? "[media]" : ""),
          updatedAt: new Date()
        },
        { upsert: true }
      );

      const toSock = onlineUsers.get(data.to);

      if (toSock) {
        io.to(toSock).emit("private_message", msg);
        msg.status = "delivered";
        await msg.save();
      }

      socket.emit("message_sent", msg);
    } catch (err) {
      console.error("MESSAGE ERROR:", err);
    }
  });

  // Seen
  socket.on("message_seen", async ({ messageId, uid }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;

    msg.status = "seen";
    await msg.save();

    const senderSock = onlineUsers.get(msg.from);
    if (senderSock) io.to(senderSock).emit("message_seen", { messageId, uid });
  });

  // Delete
  socket.on("delete_message", async ({ messageId, uid }) => {
    const msg = await Message.findById(messageId);
    if (!msg || msg.from !== uid) return;

    msg.deleted = true;
    await msg.save();

    io.emit("message_deleted", { messageId });
  });

  // React to message
  socket.on("react_to_message", async ({ messageId, emoji, uid }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;

    const idx = msg.reactions.findIndex((r) => r.userId === uid && r.emoji === emoji);

    if (idx === -1) {
      msg.reactions.push({ userId: uid, emoji });
    } else {
      msg.reactions.splice(idx, 1);
    }

    await msg.save();

    io.emit("message_reacted", {
      messageId,
      reactions: msg.reactions
    });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    if (!socket.uid) return;

    onlineUsers.delete(socket.uid);

    await User.findOneAndUpdate(
      { uid: socket.uid },
      { isOnline: false, lastSeen: new Date() }
    );

    io.emit("presence_update", {
      userId: socket.uid,
      isOnline: false,
      lastSeen: new Date()
    });

    console.log("DISCONNECTED:", socket.uid);
  });
});

// ============================================================================
// START SERVER
// ============================================================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log("Server running on port", PORT));
  })
  .catch((err) => console.error("Mongo Error:", err));
