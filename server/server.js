require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const socketHandler = require("./sockets/socketHandler");

const server = http.createServer(app);

const CLIENTS = [
  "http://localhost:5173",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: CLIENTS,
    credentials: true
  }
});

app.set("io", io);
socketHandler(io);

const PORT = process.env.PORT || 4000;

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
