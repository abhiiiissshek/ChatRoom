import { useCallback, useEffect, useRef, useState } from "react";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

const initialCall = {
  visible: false,
  status: "idle",
  type: "voice",
  peer: null,
  callId: null,
  offer: null,
  muted: false,
  cameraOff: false,
  error: "",
};

function createCallId(userId, peerId) {
  return `${userId}-${peerId}-${Date.now()}`;
}

export default function useCall({ socket, user }) {
  const [call, setCall] = useState(initialCall);
  const callRef = useRef(initialCall);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const attachStreams = useCallback(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
  }, []);

  useEffect(() => {
    attachStreams();
  }, [attachStreams, call.visible, call.status]);

  const cleanup = useCallback((error = "") => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setCall(error ? { ...initialCall, visible: true, status: "ended", error } : initialCall);
    if (error) window.setTimeout(() => setCall(initialCall), 2200);
  }, []);

  const flushCandidates = useCallback(async () => {
    const connection = peerConnectionRef.current;
    if (!connection?.remoteDescription) return;

    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createPeerConnection = useCallback(
    (peerId, callId) => {
      const connection = new RTCPeerConnection({ iceServers });

      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket?.emit("call:ice-candidate", {
          callId,
          from: user.uid,
          to: peerId,
          candidate: event.candidate,
        });
      };

      connection.ontrack = (event) => {
        const [stream] = event.streams;
        remoteStreamRef.current = stream;
        attachStreams();
      };

      connection.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(connection.connectionState)) {
          cleanup(connection.connectionState === "failed" ? "Call connection failed" : "");
        }
      };

      peerConnectionRef.current = connection;
      return connection;
    },
    [attachStreams, cleanup, socket, user.uid]
  );

  const getLocalStream = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    localStreamRef.current = stream;
    attachStreams();
    return stream;
  }, [attachStreams]);

  const startCall = useCallback(
    async (participant, type = "voice") => {
      if (!socket || !participant || callRef.current.status !== "idle") return;
      if (participant.uid === user.uid) {
        cleanup("You cannot call yourself");
        return;
      }

      const callId = createCallId(user.uid, participant.uid);

      try {
        setCall({
          ...initialCall,
          visible: true,
          status: "outgoing",
          type,
          peer: participant,
          callId,
        });

        const stream = await getLocalStream(type);
        const connection = createPeerConnection(participant.uid, callId);
        stream.getTracks().forEach((track) => connection.addTrack(track, stream));

        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId,
          from: user.uid,
          to: participant.uid,
          type,
          offer,
          caller: user,
        });
      } catch (error) {
        console.error("Start call error:", error);
        cleanup("Could not start call");
      }
    },
    [cleanup, createPeerConnection, getLocalStream, socket, user]
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!socket || !current.offer || !current.peer) return;

    try {
      const stream = await getLocalStream(current.type);
      const connection = createPeerConnection(current.peer.uid, current.callId);
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      await connection.setRemoteDescription(new RTCSessionDescription(current.offer));
      await flushCandidates();

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      socket.emit("call:answer", {
        callId: current.callId,
        from: user.uid,
        to: current.peer.uid,
        answer,
      });

      setCall((value) => ({ ...value, status: "active" }));
    } catch (error) {
      console.error("Accept call error:", error);
      cleanup("Could not accept call");
    }
  }, [cleanup, createPeerConnection, flushCandidates, getLocalStream, socket, user.uid]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    if (socket && current.peer) {
      socket.emit("call:reject", { callId: current.callId, from: user.uid, to: current.peer.uid });
    }
    cleanup();
  }, [cleanup, socket, user.uid]);

  const endCall = useCallback(() => {
    const current = callRef.current;
    if (socket && current.peer) {
      socket.emit("call:end", { callId: current.callId, from: user.uid, to: current.peer.uid });
    }
    cleanup();
  }, [cleanup, socket, user.uid]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setCall((current) => ({ ...current, muted: !audioTrack.enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCall((current) => ({ ...current, cameraOff: !videoTrack.enabled }));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOffer = ({ callId, from, type, offer, caller }) => {
      const current = callRef.current;
      if (current.visible && current.status !== "idle") {
        socket.emit("call:busy", { callId, from: user.uid, to: from });
        return;
      }

      pendingCandidatesRef.current = [];
      setCall({
        ...initialCall,
        visible: true,
        status: "incoming",
        type,
        peer: caller || { uid: from, name: "Incoming caller" },
        callId,
        offer,
      });
    };

    const handleAnswer = async ({ callId, answer }) => {
      if (callRef.current.callId !== callId || !peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushCandidates();
      setCall((current) => ({ ...current, status: "active" }));
    };

    const handleIceCandidate = async ({ callId, candidate }) => {
      if (!candidate || callRef.current.callId !== callId) return;

      if (!peerConnectionRef.current?.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleUnavailable = ({ reason }) => cleanup(reason || "User is unavailable");

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:busy", () => cleanup("User is already on a call"));
    socket.on("call:unavailable", handleUnavailable);
    socket.on("call:end", () => cleanup());
    socket.on("call:reject", () => cleanup("Call declined"));

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:busy");
      socket.off("call:unavailable", handleUnavailable);
      socket.off("call:end");
      socket.off("call:reject");
    };
  }, [cleanup, flushCandidates, socket, user.uid]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    call,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
