import { ChevronLeft, ChevronRight, Send, Smile, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Portal from "../ui/Portal";

const duration = 5200;
const reactions = ["\u2764\uFE0F", "\uD83D\uDD25", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDC4F"];

export default function StatusViewer({ open, group, user, onClose, onSeen, onReact, onReply }) {
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [progress, setProgress] = useState(0);
  const statuses = group?.statuses || [];
  const status = statuses[index];

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setProgress(0);
  }, [open, group?.user?.uid]);

  useEffect(() => {
    if (!open || !status) return undefined;
    onSeen(status._id);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, ((Date.now() - startedAt) / duration) * 100);
      setProgress(next);
      if (next >= 100) {
        if (index < statuses.length - 1) {
          setIndex((value) => value + 1);
          setProgress(0);
        } else {
          onClose();
        }
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [index, onClose, onSeen, open, status, statuses.length]);

  const bars = useMemo(() => statuses.map((item, itemIndex) => (itemIndex < index ? 100 : itemIndex === index ? progress : 0)), [index, progress, statuses]);

  if (!open || !status) return null;

  const isVideo = status.mediaType?.startsWith("video");
  const isImage = status.mediaType?.startsWith("image");

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/88 p-0 backdrop-blur-lg sm:p-5">
        <section className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-zinc-950 shadow-2xl shadow-black sm:h-[88vh] sm:rounded-3xl sm:border sm:border-white/10">
          <div className="absolute left-0 right-0 top-0 z-10 space-y-3 p-4">
            <div className="flex gap-1">
              {bars.map((value, itemIndex) => (
                <div key={statuses[itemIndex]._id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${value}%` }} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Avatar src={group.user.photoURL} name={group.user.name} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-white">{group.user.name}</h2>
                <p className="text-xs text-slate-300">Expires in 24 hours</p>
              </div>
              <IconButton title="Close" onClick={onClose} className="bg-black/35">
                <X size={18} />
              </IconButton>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center" style={{ background: status.background || "#111827" }}>
            {isVideo && <video src={status.mediaUrl} autoPlay playsInline className="h-full w-full object-contain" />}
            {isImage && <img src={status.mediaUrl} alt="" className="h-full w-full object-contain" />}
            {!status.mediaUrl && <p className="px-8 text-center text-3xl font-semibold leading-tight text-white">{status.text}</p>}
            {status.mediaUrl && status.text && <p className="absolute bottom-24 left-5 right-5 rounded-2xl bg-black/35 p-3 text-center text-sm text-white">{status.text}</p>}

            <button type="button" onClick={() => setIndex(Math.max(0, index - 1))} className="absolute left-0 top-20 h-[calc(100%-150px)] w-1/3" aria-label="Previous status">
              <ChevronLeft className="ml-2 text-white/40" size={22} />
            </button>
            <button type="button" onClick={() => (index < statuses.length - 1 ? setIndex(index + 1) : onClose())} className="absolute right-0 top-20 flex h-[calc(100%-150px)] w-1/3 justify-end" aria-label="Next status">
              <ChevronRight className="mr-2 text-white/40" size={22} />
            </button>
          </div>

          <div className="border-t border-white/10 bg-zinc-950/90 p-3">
            <div className="mb-3 flex justify-center gap-2">
              {reactions.map((emoji) => (
                <button key={emoji} type="button" onClick={() => onReact(status._id, emoji)} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-lg transition hover:bg-white/[0.14]">
                  {emoji}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!reply.trim()) return;
                onReply(status._id, reply.trim());
                setReply("");
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Reply to ${group.user.name}`} className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60" />
              </div>
              <IconButton title="Send reply" type="submit" className="bg-cyan-300 text-zinc-950 hover:bg-cyan-200">
                <Send size={17} />
              </IconButton>
            </form>
          </div>
        </section>
      </div>
    </Portal>
  );
}
