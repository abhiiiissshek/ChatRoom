const Message = require("../models/Message");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Room = require("../models/Room");

const onlineUsers = require("../utils/onlineUsers");

function userRoom(uid) {
  return `user:${uid}`;
}

function meetingRoom(roomId) {
  return `meeting:${roomId}`;
}

function groupRoom(groupId) {
  return `group:${groupId}`;
}

function addOnlineSocket(uid, socketId) {
  const sockets = onlineUsers.get(uid) || new Set();
  sockets.add(socketId);
  onlineUsers.set(uid, sockets);
}

function removeOnlineSocket(uid, socketId) {
  const sockets = onlineUsers.get(uid);
  if (!sockets) return 0;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(uid);
    return 0;
  }

  onlineUsers.set(uid, sockets);
  return sockets.size;
}

function isOnline(uid) {
  return Boolean(onlineUsers.get(uid)?.size);
}

module.exports = (io) => {

  io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id);

    socket.on("user_connected", async (uid) => {

      socket.uid = uid;

      addOnlineSocket(uid, socket.id);
      socket.join(userRoom(uid));

      await User.findOneAndUpdate(
        { uid },
        { isOnline: true }
      );

      io.emit("presence_update", {
        userId: uid,
        isOnline: true
      });

      const groups = await Conversation.find({ type: "group", members: uid }).select("_id");
      groups.forEach((group) => socket.join(groupRoom(group.id)));
    });

    // Typing
    socket.on("typing", ({ from, to }) => {

      const toSock = onlineUsers.get(to);

      if (toSock?.size) {
        io.to(userRoom(to)).emit("typing", {
          from
        });
      }
    });

    socket.on(
      "stop_typing",
      ({ from, to }) => {

        if (isOnline(to)) {
          io.to(userRoom(to)).emit(
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

        if (isOnline(data.to)) {

          io.to(userRoom(data.to)).emit(
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

    socket.on("group:join", async ({ groupId } = {}, ack) => {
      try {
        if (!groupId || !socket.uid) {
          ack?.({ ok: false, error: "Missing group or user" });
          return;
        }

        const group = await Conversation.findOne({
          _id: groupId,
          type: "group",
          members: socket.uid
        }).select("_id");

        if (!group) {
          ack?.({ ok: false, error: "Not a group member" });
          return;
        }

        socket.join(groupRoom(groupId));
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: "Could not join group" });
      }
    });

    socket.on("group:message", async (data = {}, ack) => {
      try {
        const group = await Conversation.findById(data.groupId);
        if (!group || !group.members.includes(data.from)) {
          ack?.({ ok: false, error: "Not a group member" });
          return;
        }

        if (group.settings?.onlyAdminsCanPost && !group.admins.includes(data.from)) {
          socket.emit("group:error", { groupId: data.groupId, error: "Only admins can post" });
          ack?.({ ok: false, error: "Only admins can post" });
          return;
        }

        const msg = await Message.create({
          from: data.from,
          to: data.groupId,
          conversationId: data.groupId,
          conversationType: "group",
          text: data.text,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          replyToId: data.replyToId,
          replyToText: data.replyToText,
          mentions: data.mentions || []
        });

        group.lastMessage = data.text || (data.mediaUrl ? "[media]" : "");
        group.updatedAt = new Date();
        await group.save();

        io.to(groupRoom(data.groupId)).emit("group:message", {
          groupId: data.groupId,
          message: msg
        });
        ack?.({ ok: true, message: msg });
      } catch (err) {
        socket.emit("group:error", { groupId: data.groupId, error: "Message could not be sent" });
        ack?.({ ok: false, error: "Message could not be sent" });
      }
    });

    socket.on("group:typing", ({ groupId, from }) => {
      if (groupId && from) socket.to(groupRoom(groupId)).emit("group:typing", { groupId, from });
    });

    socket.on("group:stop_typing", ({ groupId, from }) => {
      if (groupId && from) socket.to(groupRoom(groupId)).emit("group:stop_typing", { groupId, from });
    });

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

        if (isOnline(msg.from)) {
          io.to(userRoom(msg.from)).emit(
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

    // Call signaling
    socket.on("call:offer", (payload = {}) => {
      const { to, from } = payload;
      if (!to || !from || to === from) {
        socket.emit("call:unavailable", {
          callId: payload.callId,
          reason: "User is unavailable"
        });
        return;
      }

      if (!isOnline(to)) {
        socket.emit("call:unavailable", {
          callId: payload.callId,
          reason: "User is offline"
        });
        return;
      }

      io.to(userRoom(to)).emit("call:offer", payload);
    });

    socket.on("call:answer", (payload = {}) => {
      if (payload.to && isOnline(payload.to)) {
        io.to(userRoom(payload.to)).emit("call:answer", payload);
      }
    });

    socket.on("call:ice-candidate", (payload = {}) => {
      if (payload.to && isOnline(payload.to)) {
        io.to(userRoom(payload.to)).emit("call:ice-candidate", payload);
      }
    });

    socket.on("call:busy", (payload = {}) => {
      if (payload.to && isOnline(payload.to)) {
        io.to(userRoom(payload.to)).emit("call:busy", payload);
      }
    });

    socket.on("call:reject", (payload = {}) => {
      if (payload.to && isOnline(payload.to)) {
        io.to(userRoom(payload.to)).emit("call:reject", payload);
      }
    });

    socket.on("call:end", (payload = {}) => {
      if (payload.to && isOnline(payload.to)) {
        io.to(userRoom(payload.to)).emit("call:end", payload);
      }
    });

    socket.on("room:join", async ({ roomId, user }) => {
      if (!roomId || !user?.uid) return;

      const room = await Room.findOne({ roomId, active: true });
      if (!room) {
        socket.emit("room:error", { roomId, error: "Room not found" });
        return;
      }

      socket.join(meetingRoom(roomId));
      socket.meetingRoomId = roomId;

      room.participants = room.participants.filter((item) => item.uid !== user.uid);
      room.participants.push({
        uid: user.uid,
        name: user.name,
        photoURL: user.photoURL,
        socketId: socket.id
      });
      await room.save();

      socket.to(meetingRoom(roomId)).emit("room:participant-joined", {
        roomId,
        participant: { uid: user.uid, name: user.name, photoURL: user.photoURL, socketId: socket.id }
      });
      socket.emit("room:state", { roomId, participants: room.participants, chat: room.chat });
    });

    socket.on("room:signal", ({ roomId, toSocketId, signal }) => {
      if (!roomId || !toSocketId || !signal) return;
      io.to(toSocketId).emit("room:signal", {
        roomId,
        fromSocketId: socket.id,
        signal
      });
    });

    socket.on("room:media-state", async ({ roomId, uid, muted, cameraOff, screenSharing }) => {
      const room = await Room.findOne({ roomId, active: true });
      if (!room) return;

      const participant = room.participants.find((item) => item.uid === uid);
      if (participant) {
        if (muted !== undefined) participant.muted = muted;
        if (cameraOff !== undefined) participant.cameraOff = cameraOff;
        if (screenSharing !== undefined) participant.screenSharing = screenSharing;
        await room.save();
      }

      io.to(meetingRoom(roomId)).emit("room:media-state", { roomId, uid, muted, cameraOff, screenSharing });
    });

    socket.on("room:chat", async ({ roomId, from, name, text }) => {
      if (!roomId || !from || !text?.trim()) return;

      const entry = { from, name, text: text.trim(), createdAt: new Date() };
      await Room.findOneAndUpdate({ roomId, active: true }, { $push: { chat: entry } });
      io.to(meetingRoom(roomId)).emit("room:chat", { roomId, message: entry });
    });

    socket.on("room:leave", async ({ roomId, uid }) => {
      if (!roomId || !uid) return;

      socket.leave(meetingRoom(roomId));
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { participants: { uid } } }
      );
      socket.to(meetingRoom(roomId)).emit("room:participant-left", { roomId, uid, socketId: socket.id });
    });

    // Disconnect
    socket.on(
      "disconnect",
      async () => {

        if (!socket.uid) return;

        if (socket.meetingRoomId) {
          await Room.findOneAndUpdate(
            { roomId: socket.meetingRoomId },
            { $pull: { participants: { socketId: socket.id } } }
          );
          socket.to(meetingRoom(socket.meetingRoomId)).emit("room:participant-left", {
            roomId: socket.meetingRoomId,
            uid: socket.uid,
            socketId: socket.id
          });
        }

        const remainingSockets = removeOnlineSocket(socket.uid, socket.id);

        if (remainingSockets > 0) return;

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
