const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

const CLIENTS = [
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: CLIENTS,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/ai", aiRoutes);

module.exports = app;