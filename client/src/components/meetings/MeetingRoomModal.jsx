import {
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

import { useMemo, useState } from "react";

import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Portal from "../ui/Portal";

import { roomInviteUrl } from "../../services/platformService";

export default function MeetingRoomModal({
  socket,
  meeting,
  user,
  localVideoRef,
  onLeave,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
  onSendChat,
}) {

  const [chatText, setChatText] =
    useState("");

  const [
    inviteUsername,
    setInviteUsername,
  ] = useState("");

  const invite =
    meeting.room?.inviteToken
      ? roomInviteUrl(
        meeting.room.inviteToken
      )
      : "";

  const remoteParticipants =
    meeting.participants.filter(
      (item) =>
        item.uid !== user.uid
    );
  const totalParticipants =
    meeting.participants.length;

  const gridClass = useMemo(() => {

    if (totalParticipants <= 1) {
      return "grid-cols-1";
    }

    if (totalParticipants === 2) {
      return "md:grid-cols-2";
    }

    if (totalParticipants <= 4) {
      return "grid-cols-2";
    }

    return "grid-cols-2 lg:grid-cols-3";

  }, [totalParticipants]);

  if (!meeting.open) return null;

  return (
    <Portal>

      <div className="fixed inset-0 z-[85] flex bg-[#08090b] text-white">

        <main className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}

          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">

            <div className="min-w-0 flex-1">

              <h2 className="truncate font-semibold">
                {meeting.room?.title ||
                  "Meeting"}
              </h2>

              <p className="truncate text-xs text-slate-500">
                {invite}
              </p>
            </div>

            <IconButton
              title="Copy invite"
              onClick={() =>
                navigator.clipboard?.writeText(
                  invite
                )
              }
            >
              <Copy size={18} />
            </IconButton>
          </header>

          {/* BODY */}

          <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[1fr_320px]">

            {/* VIDEO GRID */}

            <section
              className={`grid min-h-0 auto-rows-fr gap-3 ${gridClass}`}
            >

              {/* LOCAL VIDEO */}

              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">

                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {meeting.cameraOff && (

                  <div className="absolute inset-0 grid place-items-center bg-slate-950">

                    <Avatar
                      src={user.photoURL}
                      name={user.name}
                      size="lg"
                    />
                  </div>
                )}

                <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs">

                  You
                </span>
              </div>

              {/* WAITING TILE */}

              {remoteParticipants.length ===
                0 && (

                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40">

                    <div className="text-center">

                      <p className="text-sm text-slate-400">
                        Waiting for participants
                      </p>

                      <p className="mt-2 text-xs text-slate-600">
                        Invite someone to join
                      </p>
                    </div>
                  </div>
                )}

              {/* REMOTE PARTICIPANTS */}

              {remoteParticipants.map(
                (participant) => {

                  const hasVideo =
                    participant.stream &&
                    !participant.cameraOff;

                  return (

                    <div
                      key={
                        participant.socketId ||
                        participant.uid
                      }
                      className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
                    >

                      {hasVideo ? (

                        <video
                          autoPlay
                          playsInline
                          ref={(node) => {

                            if (
                              node &&
                              participant.stream &&
                              node.srcObject !==
                              participant.stream
                            ) {

                              node.srcObject =
                                participant.stream;
                            }
                          }}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex flex-col items-center gap-3">

                          <Avatar
                            src={
                              participant.photoURL
                            }
                            name={
                              participant.name
                            }
                            size="lg"
                          />

                          <span className="text-sm text-slate-300">
                            {
                              participant.name
                            }
                          </span>

                          <span className="text-xs text-slate-500">
                            Connecting...
                          </span>
                        </div>
                      )}

                      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs">

                        {participant.name}
                      </span>

                      {participant.muted && (

                        <div className="absolute right-3 top-3 rounded-full bg-black/60 p-2">

                          <MicOff size={14} />
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </section>

            {/* SIDEBAR */}

            <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:flex">

              {/* PARTICIPANTS */}

              <div className="flex items-center gap-2 border-b border-white/10 p-3 text-sm font-semibold">

                <Users size={16} />

                Participants

                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs">

                  {totalParticipants}
                </span>
              </div>

              <div className="space-y-1 p-2">

                {[
                  {
                    uid: user.uid,
                    name: user.name,
                    photoURL:
                      user.photoURL,
                  },

                  ...remoteParticipants,
                ].map((participant) => (

                  <div
                    key={
                      participant.socketId ||
                      participant.uid
                    }
                    className="flex items-center gap-3 rounded-xl p-2"
                  >

                    <Avatar
                      src={
                        participant.photoURL
                      }
                      name={
                        participant.name
                      }
                      size="sm"
                    />

                    <span className="min-w-0 flex-1 truncate text-sm">

                      {participant.name}
                    </span>

                    {participant.muted && (
                      <MicOff
                        size={13}
                        className="text-slate-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* INVITE */}

              <div className="border-t border-white/10 p-3">

                <p className="mb-2 text-sm font-semibold text-slate-300">

                  Invite user
                </p>

                <div className="flex gap-2">

                  <input
                    value={
                      inviteUsername
                    }
                    onChange={(e) =>
                      setInviteUsername(
                        e.target.value
                      )
                    }
                    placeholder="Enter username"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm outline-none"
                  />

                  <button
                    onClick={() => {

                      if (
                        !inviteUsername.trim()
                      ) {
                        return;
                      }

                      socket?.emit(
                        "room:invite",
                        {
                          toUsername:
                            inviteUsername.trim(),

                          room:
                            meeting.room,

                          from: {
                            uid:
                              user.uid,

                            name:
                              user.name,

                            username:
                              user.username,

                            photoURL:
                              user.photoURL,
                          },
                        }
                      );

                      setInviteUsername(
                        ""
                      );
                    }}
                    className="rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
                  >

                    Invite
                  </button>
                </div>
              </div>

              {/* CHAT */}

              <div className="mt-auto flex min-h-0 flex-1 flex-col border-t border-white/10 p-3">

                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">

                  <MessageSquare
                    size={15}
                  />

                  Meeting chat
                </div>

                <div className="mb-3 flex-1 space-y-2 overflow-y-auto text-sm">

                  {meeting.chat.length ===
                    0 && (

                      <p className="text-xs text-slate-500">
                        No messages yet
                      </p>
                    )}

                  {meeting.chat.map(
                    (
                      message,
                      index
                    ) => (

                      <p
                        key={`${message.createdAt}-${index}`}
                        className="rounded-xl bg-white/[0.06] px-3 py-2 text-slate-300"
                      >

                        <span className="font-semibold text-white">

                          {message.name ||
                            "User"}
                          :
                        </span>{" "}

                        {message.text}
                      </p>
                    )
                  )}
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(
                    event
                  ) => {

                    event.preventDefault();

                    if (
                      !chatText.trim()
                    ) {
                      return;
                    }

                    onSendChat(
                      chatText
                    );

                    setChatText("");
                  }}
                >

                  <input
                    value={chatText}
                    onChange={(e) =>
                      setChatText(
                        e.target.value
                      )
                    }
                    placeholder="Message"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
                  >

                    Send
                  </button>
                </form>
              </div>
            </aside>
          </div>

          {/* ERROR */}

          {meeting.error && (

            <p className="px-4 pb-2 text-center text-sm text-rose-200">

              {meeting.error}
            </p>
          )}

          {/* FOOTER */}

          <footer className="flex h-20 shrink-0 items-center justify-center gap-3 border-t border-white/10 px-4">

            <IconButton
              title={
                meeting.muted
                  ? "Unmute"
                  : "Mute"
              }
              onClick={onToggleMute}
            >

              {meeting.muted ? (
                <MicOff size={19} />
              ) : (
                <Mic size={19} />
              )}
            </IconButton>

            <IconButton
              title={
                meeting.cameraOff
                  ? "Turn camera on"
                  : "Turn camera off"
              }
              onClick={
                onToggleCamera
              }
            >

              {meeting.cameraOff ? (
                <VideoOff size={19} />
              ) : (
                <Video size={19} />
              )}
            </IconButton>

            <IconButton
              title="Share screen"
              onClick={
                onShareScreen
              }
              className={
                meeting.screenSharing
                  ? "bg-cyan-300 text-zinc-950"
                  : ""
              }
            >

              <MonitorUp size={19} />
            </IconButton>

            <button
              onClick={onLeave}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-rose-500 px-5 font-semibold text-white transition hover:bg-rose-400"
            >

              <PhoneOff size={18} />

              Leave
            </button>

            <button
              onClick={onEnd}
              className="hidden h-12 items-center gap-2 rounded-2xl border border-rose-400/35 px-4 font-semibold text-rose-100 transition hover:bg-rose-500/10 sm:inline-flex"
            >

              End
            </button>
          </footer>
        </main>
      </div>
    </Portal>
  );
}