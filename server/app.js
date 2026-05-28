const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const statusRoutes = require("./routes/statusRoutes");
const roomRoutes = require("./routes/roomRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

const CLIENTS = [
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: CLIENTS,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  })
);

app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/groups", groupRoutes);

module.exports = app;
