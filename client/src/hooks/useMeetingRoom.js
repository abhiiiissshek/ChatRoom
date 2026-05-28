import { useCallback, useEffect, useRef, useState } from "react";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export default function useMeetingRoom({ socket, user }) {
  const [meeting, setMeeting] = useState({
    open: false,
    room: null,
    participants: [],
    chat: [],
    muted: false,
    cameraOff: false,
    screenSharing: false,
    error: "",
  });
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const roomRef = useRef(null);

  useEffect(() => {
    roomRef.current = meeting.room;
  }, [meeting.room]);

  const attachLocal = useCallback(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  }, []);

  const stopLocal = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    attachLocal();
  }, [attachLocal]);

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    attachLocal();
    return stream;
  }, [attachLocal]);

  const createPeer = useCallback(
    async (socketId, initiator) => {
      if (!socket || peersRef.current.has(socketId)) return peersRef.current.get(socketId);

      const stream = await getLocalStream();
      const peer = new RTCPeerConnection({ iceServers });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {

        const remoteStream = event.streams[0];

        setMeeting((current) => ({
          ...current,

          participants: current.participants.map(
            (participant) => {

              if (participant.socketId !== socketId) {
                return participant;
              }

              return {
                ...participant,
                stream: remoteStream,
              };
            }
          ),
        }));
      };

      peer.onicecandidate = (event) => {
        if (!event.candidate || !roomRef.current?.roomId) return;
        socket.emit("room:signal", {
          roomId: roomRef.current.roomId,
          toSocketId: socketId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      };

      peersRef.current.set(socketId, peer);

      if (initiator) {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("room:signal", {
          roomId: roomRef.current.roomId,
          toSocketId: socketId,
          signal: { type: "offer", description: offer },
        });
      }

      return peer;
    },
    [getLocalStream, socket]
  );

  const joinRoom = useCallback(
    async (room) => {

      if (!socket || !room) return;

      setMeeting((current) => ({
        ...current,

        open: true,
        room,

        participants: [],
        chat: [],
        error: "",
      }));

      try {

        await getLocalStream();

        socket.emit(
          "room:join",
          {
            roomId: room.roomId,
            user,
          }
        );

      } catch (error) {

        console.error(
          "Meeting media error:",
          error
        );

        setMeeting((current) => ({
          ...current,

          error:
            "Camera or microphone permission was blocked",
        }));
      }
    },
    [getLocalStream, socket, user]
  );

  const leaveRoom = useCallback(() => {
    if (socket && meeting.room) socket.emit("room:leave", { roomId: meeting.room.roomId, uid: user.uid });
    stopLocal();
    setMeeting({ open: false, room: null, participants: [], chat: [], muted: false, cameraOff: false, screenSharing: false, error: "" });
  }, [meeting.room, socket, stopLocal, user.uid]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track || !socket || !meeting.room) return;
    track.enabled = !track.enabled;
    const muted = !track.enabled;
    setMeeting((current) => ({ ...current, muted }));
    socket.emit("room:media-state", { roomId: meeting.room.roomId, uid: user.uid, muted });
  }, [meeting.room, socket, user.uid]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track || !socket || !meeting.room) return;
    track.enabled = !track.enabled;
    const cameraOff = !track.enabled;
    setMeeting((current) => ({ ...current, cameraOff }));
    socket.emit("room:media-state", { roomId: meeting.room.roomId, uid: user.uid, cameraOff });
  }, [meeting.room, socket, user.uid]);

  const shareScreen = useCallback(async () => {
    if (!socket || !meeting.room) return;
    if (meeting.screenSharing) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;
      attachLocal();
      setMeeting((current) => ({ ...current, screenSharing: false }));
      socket.emit("room:media-state", { roomId: meeting.room.roomId, uid: user.uid, screenSharing: false });
      return;
    }

    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const videoTrack = display.getVideoTracks()[0];
    const oldVideo = localStreamRef.current?.getVideoTracks()[0];
    if (oldVideo) localStreamRef.current.removeTrack(oldVideo);
    localStreamRef.current.addTrack(videoTrack);
    attachLocal();
    setMeeting((current) => ({ ...current, screenSharing: true }));
    socket.emit("room:media-state", { roomId: meeting.room.roomId, uid: user.uid, screenSharing: true });
  }, [attachLocal, meeting.room, meeting.screenSharing, socket, user.uid]);

  const sendChat = useCallback(
    (text) => {
      if (!socket || !meeting.room || !text.trim()) return;
      socket.emit("room:chat", { roomId: meeting.room.roomId, from: user.uid, name: user.name, text });
    },
    [meeting.room, socket, user.name, user.uid]
  );

  useEffect(() => {
    if (!socket) return undefined;

    const handleState = ({
      participants = [],
      chat = [],
    }) => {

      const uniqueParticipants = Array.from(
        new Map(
          participants.map((participant) => [
            participant.socketId ||
            participant.uid,

            participant,
          ])
        ).values()
      );

      setMeeting((current) => ({
        ...current,

        participants: uniqueParticipants,

        chat:
          chat.length >
            current.chat.length
            ? chat
            : current.chat,
      }));

      uniqueParticipants.forEach(
        (participant) => {

          if (
            participant.socketId !== socket.id
          ) {

            if (
              !peersRef.current.has(
                participant.socketId
              )
            ) {

              createPeer(
                participant.socketId,
                true
              );
            }
          }
        }
      );
    };

    const handleJoined = ({ participant }) => {

      setMeeting((current) => {

        const uniqueParticipants = Array.from(
          new Map(
            [
              ...current.participants,
              participant,
            ].map((item) => [
              item.socketId || item.uid,
              item,
            ])
          ).values()
        );

        return {
          ...current,
          participants: uniqueParticipants,
        };
      });

      if (participant.socketId !== socket.id) {
        createPeer(participant.socketId, true);
      }
    };

    const handleLeft = ({ socketId }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
      setMeeting((current) => ({ ...current, participants: current.participants.filter((item) => item.socketId !== socketId) }));
    };

    const handleSignal = async ({ fromSocketId, signal }) => {
      const peer = await createPeer(fromSocketId, false);
      if (signal.type === "offer") {
        if (
          peer.signalingState !==
          "stable"
        ) {
          return;
        }
        await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("room:signal", {
          roomId: roomRef.current?.roomId,
          toSocketId: fromSocketId,
          signal: { type: "answer", description: answer },
        });
      }
      if (signal.type === "answer") await peer.setRemoteDescription(new RTCSessionDescription(signal.description));
      if (signal.type === "candidate") await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
    };

    const handleMediaState = ({
      uid,
      muted,
      cameraOff,
      screenSharing,
    }) => {

      setMeeting((current) => ({
        ...current,

        participants: current.participants.map(
          (participant) => {

            if (participant.uid !== uid) {
              return participant;
            }

            return {
              ...participant,

              ...(muted !== undefined
                ? { muted }
                : {}),

              ...(cameraOff !== undefined
                ? { cameraOff }
                : {}),

              ...(screenSharing !== undefined
                ? { screenSharing }
                : {}),
            };
          }
        ),
      }));
    };
    const handleChat = ({ message }) => {
      setMeeting((current) => ({ ...current, chat: [...current.chat, message] }));
    };

    socket.on("room:state", handleState);
    socket.on("room:participant-joined", handleJoined);
    socket.on("room:participant-left", handleLeft);
    socket.on("room:signal", handleSignal);
    socket.on("room:media-state", handleMediaState);
    socket.on("room:chat", handleChat);
    socket.on("room:error", ({ error }) => setMeeting((current) => ({ ...current, error })));

    return () => {
      socket.off("room:state", handleState);
      socket.off("room:participant-joined", handleJoined);
      socket.off("room:participant-left", handleLeft);
      socket.off("room:signal", handleSignal);
      socket.off("room:media-state", handleMediaState);
      socket.off("room:chat", handleChat);
      socket.off("room:error");
    };
  }, [createPeer, meeting.room?.roomId, socket]);

  useEffect(() => () => stopLocal(), [stopLocal]);

  return {
    meeting,
    localVideoRef,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    shareScreen,
    sendChat,
  };
}
