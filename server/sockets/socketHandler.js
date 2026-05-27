const Message = require("../models/Message");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

const onlineUsers = require("../utils/onlineUsers");

module.exports = (io) => {

  io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id);

    socket.on("user_connected", async (uid) => {

      socket.uid = uid;

      onlineUsers.set(uid, socket.id);

      await User.findOneAndUpdate(
        { uid },
        { isOnline: true }
      );

      io.emit("presence_update", {
        userId: uid,
        isOnline: true
      });
    });

    // Typing
    socket.on("typing", ({ from, to }) => {

      const toSock = onlineUsers.get(to);

      if (toSock) {
        io.to(toSock).emit("typing", {
          from
        });
      }
    });

    socket.on(
      "stop_typing",
      ({ from, to }) => {

        const toSock =
          onlineUsers.get(to);

        if (toSock) {
          io.to(toSock).emit(
            "stop_typing",
            { from }
          );
        }
      }
    );

    // Private Message
    socket.on(
      "private_message",
      async (data) => {

        const msg =
          await Message.create(data);

        const parts = [
          data.from,
          data.to
        ].sort();

        await Conversation.findOneAndUpdate(
          {
            participants: parts
          },
          {
            participants: parts,

            lastMessage:
              data.text ||
              (data.mediaUrl
                ? "[media]"
                : ""),

            updatedAt: new Date()
          },
          {
            upsert: true
          }
        );

        const toSock =
          onlineUsers.get(data.to);

        if (toSock) {

          io.to(toSock).emit(
            "private_message",
            msg
          );

          msg.status = "delivered";

          await msg.save();
        }

        socket.emit(
          "message_sent",
          msg
        );
      }
    );

    // Seen
    socket.on(
      "message_seen",
      async ({
        messageId,
        uid
      }) => {

        const msg =
          await Message.findById(
            messageId
          );

        if (!msg) return;

        msg.status = "seen";

        await msg.save();

        const senderSock =
          onlineUsers.get(msg.from);

        if (senderSock) {
          io.to(senderSock).emit(
            "message_seen",
            {
              messageId,
              uid
            }
          );
        }
      }
    );

    // Delete
    socket.on(
      "delete_message",
      async ({
        messageId,
        uid
      }) => {

        const msg =
          await Message.findById(
            messageId
          );

        if (!msg) return;

        if (msg.from !== uid) return;

        msg.deleted = true;

        await msg.save();

        io.emit(
          "message_deleted",
          { messageId }
        );
      }
    );

    // React
    socket.on(
      "react_to_message",
      async ({
        messageId,
        emoji,
        uid
      }) => {

        const msg =
          await Message.findById(
            messageId
          );

        if (!msg) return;

        const idx =
          msg.reactions.findIndex(
            (r) =>
              r.userId === uid &&
              r.emoji === emoji
          );

        if (idx === -1) {
          msg.reactions.push({
            userId: uid,
            emoji
          });
        } else {
          msg.reactions.splice(idx, 1);
        }

        await msg.save();

        io.emit(
          "message_reacted",
          {
            messageId,
            reactions:
              msg.reactions
          }
        );
      }
    );

    // Disconnect
    socket.on(
      "disconnect",
      async () => {

        if (!socket.uid) return;

        onlineUsers.delete(
          socket.uid
        );

        await User.findOneAndUpdate(
          { uid: socket.uid },
          {
            isOnline: false,
            lastSeen: new Date()
          }
        );

        io.emit(
          "presence_update",
          {
            userId: socket.uid,
            isOnline: false,
            lastSeen: new Date()
          }
        );

        console.log(
          "Disconnected:",
          socket.uid
        );
      }
    );
  });
};