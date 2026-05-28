import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Portal from "../ui/Portal";

export default function CallModal({
  call,
  participant,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  if (!call?.visible) return null;

  const isVideo = call.type === "video";
  const isIncoming = call.status === "incoming";
  const title =
    call.status === "ended"
      ? call.error || "Call ended"
      : call.status === "active"
      ? `${isVideo ? "Video" : "Voice"} call`
      : isIncoming
      ? `Incoming ${isVideo ? "video" : "voice"} call`
      : `Calling ${participant?.name || "user"}`;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
        <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-medium text-slate-400">{title}</p>
          </div>

        <div className="grid gap-3 p-4 md:grid-cols-2">
          <VideoPane
            label={participant?.name || "Remote"}
            videoRef={remoteVideoRef}
            showVideo={isVideo && call.status === "active"}
            avatar={participant}
          />
          <VideoPane
            label="You"
            videoRef={localVideoRef}
            showVideo={isVideo}
            muted
          />
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-white/10 px-5 py-4">
          {call.status === "ended" ? (
            <p className="text-sm text-slate-400">{call.error || "Call ended"}</p>
          ) : isIncoming ? (
            <>
              <button
                onClick={onReject}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-rose-500 px-5 font-semibold text-white transition hover:bg-rose-400"
              >
                <PhoneOff size={18} />
                Reject
              </button>
              <button
                onClick={onAccept}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-400 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Accept
              </button>
            </>
          ) : (
            <>
              <IconButton title={call.muted ? "Unmute" : "Mute"} onClick={onToggleMute}>
                {call.muted ? <MicOff size={19} /> : <Mic size={19} />}
              </IconButton>

              {isVideo && (
                <IconButton title={call.cameraOff ? "Turn camera on" : "Turn camera off"} onClick={onToggleCamera}>
                  {call.cameraOff ? <VideoOff size={19} /> : <Video size={19} />}
                </IconButton>
              )}

              <button
                onClick={onEnd}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-rose-500 px-5 font-semibold text-white transition hover:bg-rose-400"
              >
                <PhoneOff size={18} />
                End
              </button>
            </>
          )}
        </div>
        </section>
      </div>
    </Portal>
  );
}

function VideoPane({ label, videoRef, showVideo, muted = false, avatar }) {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatar?.photoURL} name={avatar?.name || label} size="lg" />
          <span className="text-sm text-slate-400">{label}</span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-slate-200">
        {label}
      </div>
    </div>
  );
}
