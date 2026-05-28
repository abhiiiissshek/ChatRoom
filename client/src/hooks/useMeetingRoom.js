import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const iceServers = [
  {
    urls:
      "stun:stun.l.google.com:19302",
  },
];

const initialMeetingState = {
  open: false,
  room: null,
  participants: [],
  chat: [],
  muted: false,
  cameraOff: false,
  screenSharing: false,
  error: "",
};

export default function useMeetingRoom({
  socket,
  user,
}) {

  const [meeting, setMeeting] =
    useState(initialMeetingState);

  const localVideoRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const peersRef = useRef(
    new Map()
  );

  const roomRef = useRef(null);

  useEffect(() => {
    roomRef.current =
      meeting.room;
  }, [meeting.room]);

  const attachLocal =
    useCallback(() => {

      if (
        localVideoRef.current &&
        localStreamRef.current
      ) {

        localVideoRef.current.srcObject =
          localStreamRef.current;
      }
    }, []);

  const stopLocal =
    useCallback(() => {

      localStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current =
        null;

      peersRef.current.forEach(
        (peer) => peer.close()
      );

      peersRef.current.clear();

    }, []);

  const getLocalStream =
    useCallback(async () => {

      if (
        localStreamRef.current
      ) {
        return localStreamRef.current;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
            video: true,
          }
        );

      localStreamRef.current =
        stream;

      attachLocal();

      return stream;

    }, [attachLocal]);

  const createPeer =
    useCallback(
      async (
        socketId,
        initiator
      ) => {

        if (
          !socket ||
          socketId === socket.id
        ) {
          return null;
        }

        if (
          peersRef.current.has(
            socketId
          )
        ) {
          return peersRef.current.get(
            socketId
          );
        }

        const stream =
          await getLocalStream();

        const peer =
          new RTCPeerConnection({
            iceServers,
          });

        stream
          .getTracks()
          .forEach((track) => {

            peer.addTrack(
              track,
              stream
            );
          });

        peer.ontrack = (
          event
        ) => {

          const remoteStream =
            event.streams[0];

          setMeeting(
            (current) => ({

              ...current,

              participants:
                current.participants.map(
                  (
                    participant
                  ) => {

                    if (
                      participant.socketId !==
                      socketId
                    ) {
                      return participant;
                    }

                    return {
                      ...participant,
                      stream:
                        remoteStream,
                    };
                  }
                ),
            })
          );
        };

        peer.onicecandidate = (
          event
        ) => {

          if (
            !event.candidate ||
            !roomRef.current
              ?.roomId
          ) {
            return;
          }

          socket.emit(
            "room:signal",
            {
              roomId:
                roomRef.current
                  .roomId,

              toSocketId:
                socketId,

              signal: {
                type:
                  "candidate",

                candidate:
                  event.candidate,
              },
            }
          );
        };

        peer.onconnectionstatechange =
          () => {

            if (
              peer.connectionState ===
              "failed" ||
              peer.connectionState ===
              "closed" ||
              peer.connectionState ===
              "disconnected"
            ) {

              peer.close();

              peersRef.current.delete(
                socketId
              );

              setMeeting(
                (
                  current
                ) => ({
                  ...current,

                  participants:
                    current.participants.filter(
                      (
                        participant
                      ) =>
                        participant.socketId !==
                        socketId
                    ),
                })
              );
            }
          };

        peersRef.current.set(
          socketId,
          peer
        );

        if (initiator) {

          const offer =
            await peer.createOffer();

          await peer.setLocalDescription(
            offer
          );

          socket.emit(
            "room:signal",
            {
              roomId:
                roomRef.current
                  ?.roomId,

              toSocketId:
                socketId,

              signal: {
                type:
                  "offer",

                description:
                  offer,
              },
            }
          );
        }

        return peer;
      },
      [
        getLocalStream,
        socket,
      ]
    );

  const joinRoom =
    useCallback(
      async (room) => {

        if (
          !socket ||
          !room
        ) {
          return;
        }

        setMeeting({
          ...initialMeetingState,

          open: true,
          room,

          participants: [
            {
              uid: user.uid,
              name:
                user.name,
              photoURL:
                user.photoURL,
              socketId:
                socket.id,
            },
          ],
        });

        try {

          await getLocalStream();

          socket.emit(
            "room:join",
            {
              roomId:
                room.roomId,
              user,
            }
          );

        } catch (error) {

          console.error(
            "Meeting media error:",
            error
          );

          setMeeting(
            (
              current
            ) => ({
              ...current,

              error:
                "Camera or microphone permission was blocked",
            })
          );
        }
      },
      [
        getLocalStream,
        socket,
        user,
      ]
    );

  const leaveRoom =
    useCallback(() => {

      if (
        socket &&
        meeting.room
      ) {

        socket.emit(
          "room:leave",
          {
            roomId:
              meeting.room
                .roomId,

            uid:
              user.uid,
          }
        );
      }

      stopLocal();

      setMeeting(
        initialMeetingState
      );

    }, [
      meeting.room,
      socket,
      stopLocal,
      user.uid,
    ]);

  const toggleMute =
    useCallback(() => {

      const track =
        localStreamRef.current?.getAudioTracks()[0];

      if (
        !track ||
        !socket ||
        !meeting.room
      ) {
        return;
      }

      track.enabled =
        !track.enabled;

      const muted =
        !track.enabled;

      setMeeting(
        (
          current
        ) => ({
          ...current,
          muted,
        })
      );

      socket.emit(
        "room:media-state",
        {
          roomId:
            meeting.room
              .roomId,

          uid: user.uid,

          muted,
        }
      );
    }, [
      meeting.room,
      socket,
      user.uid,
    ]);

  const toggleCamera =
    useCallback(() => {

      const track =
        localStreamRef.current?.getVideoTracks()[0];

      if (
        !track ||
        !socket ||
        !meeting.room
      ) {
        return;
      }

      track.enabled =
        !track.enabled;

      const cameraOff =
        !track.enabled;

      setMeeting(
        (
          current
        ) => ({
          ...current,
          cameraOff,
        })
      );

      socket.emit(
        "room:media-state",
        {
          roomId:
            meeting.room
              .roomId,

          uid: user.uid,

          cameraOff,
        }
      );
    }, [
      meeting.room,
      socket,
      user.uid,
    ]);

  const shareScreen =
    useCallback(async () => {

      if (
        !meeting.room
      ) {
        return;
      }

      const display =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: true,
            audio: true,
          }
        );

      const screenTrack =
        display.getVideoTracks()[0];

      peersRef.current.forEach(
        (peer) => {

          const sender =
            peer
              .getSenders()
              .find(
                (s) =>
                  s.track
                    ?.kind ===
                  "video"
              );

          if (sender) {

            sender.replaceTrack(
              screenTrack
            );
          }
        }
      );

      localStreamRef.current
        .getVideoTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current.removeTrack(
        localStreamRef.current.getVideoTracks()[0]
      );

      localStreamRef.current.addTrack(
        screenTrack
      );

      attachLocal();

      setMeeting(
        (
          current
        ) => ({
          ...current,

          screenSharing:
            true,
        })
      );

      screenTrack.onended =
        async () => {

          const camera =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
              }
            );

          const cameraTrack =
            camera.getVideoTracks()[0];

          peersRef.current.forEach(
            (peer) => {

              const sender =
                peer
                  .getSenders()
                  .find(
                    (
                      s
                    ) =>
                      s.track
                        ?.kind ===
                      "video"
                  );

              if (sender) {

                sender.replaceTrack(
                  cameraTrack
                );
              }
            }
          );

          localStreamRef.current.removeTrack(
            screenTrack
          );

          localStreamRef.current.addTrack(
            cameraTrack
          );

          attachLocal();

          setMeeting(
            (
              current
            ) => ({
              ...current,

              screenSharing:
                false,
            })
          );
        };

    }, [
      attachLocal,
      meeting.room,
    ]);

  const sendChat =
    useCallback(
      (text) => {

        if (
          !socket ||
          !meeting.room ||
          !text.trim()
        ) {
          return;
        }

        const message = {
          from: user.uid,
          name: user.name,
          text:
            text.trim(),

          createdAt:
            new Date().toISOString(),
        };

        setMeeting(
          (current) => ({

            ...current,

            chat: [
              ...current.chat,
              message,
            ],
          })
        );

        socket.emit(
          "room:chat",
          {
            roomId:
              meeting.room
                .roomId,

            ...message,
          }
        );

      },
      [
        meeting.room,
        socket,
        user,
      ]
    );

  useEffect(() => {

    if (!socket) {
      return undefined;
    }

    const handleState =
      ({
        participants = [],
        chat = [],
      }) => {

        const uniqueParticipants =
          Array.from(
            new Map(
              participants.map(
                (
                  participant
                ) => [
                    participant.uid,
                    participant,
                  ]
              )
            ).values()
          );

        setMeeting(
          (current) => ({

            ...current,

            participants:
              uniqueParticipants.map(
                (
                  participant
                ) => {

                  const existing =
                    current.participants.find(
                      (
                        item
                      ) =>
                        item.uid ===
                        participant.uid
                    );

                  return {
                    ...participant,

                    stream:
                      existing?.stream,
                  };
                }
              ),

            chat:
              chat.length >
                current.chat.length
                ? chat
                : current.chat,
          })
        );

        uniqueParticipants.forEach(
          async (
            participant
          ) => {

            if (
              participant.socketId ===
              socket.id
            ) {
              return;
            }

            if (
              peersRef.current.has(
                participant.socketId
              )
            ) {
              return;
            }

            const shouldInitiate =
              socket.id <
              participant.socketId;

            await createPeer(
              participant.socketId,
              shouldInitiate
            );
          }
        );
      };

    const handleJoined =
      ({
        participant,
      }) => {

        setMeeting(
          (current) => {

            const exists =
              current.participants.some(
                (item) =>
                  item.uid ===
                  participant.uid
              );

            if (exists) {
              return current;
            }

            return {
              ...current,

              participants: [
                ...current.participants,
                participant,
              ],
            };
          }
        );

        // IMPORTANT:
        // DO NOT CREATE PEER HERE
        // room:state handles it
      };

    const handleLeft =
      ({ socketId }) => {

        peersRef.current
          .get(socketId)
          ?.close();

        peersRef.current.delete(
          socketId
        );

        setMeeting(
          (current) => ({
            ...current,

            participants:
              current.participants.filter(
                (
                  participant
                ) =>
                  participant.socketId !==
                  socketId
              ),
          })
        );
      };

    const handleSignal =
      async ({
        fromSocketId,
        signal,
      }) => {

        const peer =
          await createPeer(
            fromSocketId,
            false
          );

        if (!peer) return;

        try {

          if (
            signal.type ===
            "offer"
          ) {

            if (
              peer.signalingState !==
              "stable"
            ) {

              await Promise.all([
                peer.setLocalDescription(
                  {
                    type:
                      "rollback",
                  }
                ),

                peer.setRemoteDescription(
                  new RTCSessionDescription(
                    signal.description
                  )
                ),
              ]);

            } else {

              await peer.setRemoteDescription(
                new RTCSessionDescription(
                  signal.description
                )
              );
            }

            const answer =
              await peer.createAnswer();

            await peer.setLocalDescription(
              answer
            );

            socket.emit(
              "room:signal",
              {
                roomId:
                  roomRef.current
                    ?.roomId,

                toSocketId:
                  fromSocketId,

                signal: {
                  type:
                    "answer",

                  description:
                    answer,
                },
              }
            );
          }

          if (
            signal.type ===
            "answer"
          ) {

            await peer.setRemoteDescription(
              new RTCSessionDescription(
                signal.description
              )
            );
          }

          if (
            signal.type ===
            "candidate"
          ) {

            await peer.addIceCandidate(
              new RTCIceCandidate(
                signal.candidate
              )
            );
          }

        } catch (error) {

          console.error(
            "Signal error:",
            error
          );
        }
      };

    const handleMediaState =
      ({
        uid,
        muted,
        cameraOff,
        screenSharing,
      }) => {

        setMeeting(
          (current) => ({
            ...current,

            participants:
              current.participants.map(
                (
                  participant
                ) => {

                  if (
                    participant.uid !==
                    uid
                  ) {
                    return participant;
                  }

                  return {
                    ...participant,

                    ...(muted !==
                      undefined
                      ? {
                        muted,
                      }
                      : {}),

                    ...(cameraOff !==
                      undefined
                      ? {
                        cameraOff,
                      }
                      : {}),

                    ...(screenSharing !==
                      undefined
                      ? {
                        screenSharing,
                      }
                      : {}),
                  };
                }
              ),
          })
        );
      };

    const handleChat =
      ({ message }) => {

        setMeeting(
          (current) => {

            const alreadyExists =
              current.chat.some(
                (
                  item
                ) =>
                  item.createdAt ===
                  message.createdAt &&
                  item.from ===
                  message.from &&
                  item.text ===
                  message.text
              );

            if (
              alreadyExists
            ) {
              return current;
            }

            return {
              ...current,

              chat: [
                ...current.chat,
                message,
              ],
            };
          }
        );
      };

    socket.on(
      "room:state",
      handleState
    );

    socket.on(
      "room:participant-joined",
      handleJoined
    );

    socket.on(
      "room:participant-left",
      handleLeft
    );

    socket.on(
      "room:signal",
      handleSignal
    );

    socket.on(
      "room:media-state",
      handleMediaState
    );

    socket.on(
      "room:chat",
      handleChat
    );

    socket.on(
      "room:error",
      ({ error }) => {

        setMeeting(
          (
            current
          ) => ({
            ...current,
            error,
          })
        );
      }
    );

    return () => {

      socket.off(
        "room:state",
        handleState
      );

      socket.off(
        "room:participant-joined",
        handleJoined
      );

      socket.off(
        "room:participant-left",
        handleLeft
      );

      socket.off(
        "room:signal",
        handleSignal
      );

      socket.off(
        "room:media-state",
        handleMediaState
      );

      socket.off(
        "room:chat",
        handleChat
      );

      socket.off(
        "room:error"
      );
    };

  }, [
    createPeer,
    socket,
  ]);

  useEffect(() => {

    return () => {
      stopLocal();
    };

  }, [stopLocal]);

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