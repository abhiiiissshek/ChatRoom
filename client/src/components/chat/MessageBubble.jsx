import { motion } from "framer-motion";
import { Check, CheckCheck, CornerUpLeft, Smile, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import { formatTime } from "../../utils/formatTime";

function MessageBubble({
  message,
  isMe,
  onReply,
  onDelete,
  onReact,
  onSeen,
  searchQuery = "",
}) {
  const statusIcon =
    message.status === "seen" || message.status === "delivered" ? (
      <CheckCheck size={14} className={message.status === "seen" ? "text-sky-200" : ""} />
    ) : (
      <Check size={14} />
    );

  const quickReactions = ["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDD25"];
  const renderedText = useMemo(
    () => renderHighlightedText(message.text, searchQuery),
    [message.text, searchQuery]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => !isMe && onSeen?.(message._id)}
      className={`group relative flex items-end py-0.5 ${isMe ? "justify-end pr-0 sm:pr-12" : "justify-start pl-0 sm:pl-12"}`}
    >
      {!isMe && (
        <div className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 sm:flex">
          <MessageActions message={message} onReply={onReply} onReact={onReact} />
        </div>
      )}

      <div
        className={`max-w-[86%] rounded-3xl px-4 py-3 shadow-xl md:max-w-[66%] ${
          isMe
            ? "rounded-br-lg bg-cyan-300 text-zinc-950"
            : "rounded-bl-lg border border-white/10 bg-white/[0.09] text-slate-100 backdrop-blur-xl"
        }`}
      >
        {message.replyToText && !message.deleted && (
          <div className={`mb-2 rounded-2xl border-l-2 px-3 py-2 text-xs ${isMe ? "border-zinc-950/30 bg-zinc-950/10" : "border-cyan-300 bg-white/[0.07] text-slate-300"}`}>
            {message.replyToText}
          </div>
        )}

        {message.deleted ? (
          <p className="italic opacity-70">Message removed</p>
        ) : (
          <>
            {message.mediaUrl && message.mediaType?.startsWith("image") && (
              <img src={message.mediaUrl} alt="Attachment" className="mb-2 max-h-72 rounded-2xl object-cover" />
            )}

            {message.mediaUrl && message.mediaType?.startsWith("audio") && (
              <audio src={message.mediaUrl} controls className="mb-2 max-w-full" />
            )}

            {message.mediaUrl && !message.mediaType?.startsWith("image") && !message.mediaType?.startsWith("audio") && (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="mb-2 block underline">
                Open attachment
              </a>
            )}

            {message.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{renderedText}</p>}
          </>
        )}

        {!message.deleted && message.reactions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction, index) => (
              <span key={`${reaction.userId}-${reaction.emoji}-${index}`} className="rounded-full bg-black/15 px-2 py-0.5 text-xs">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        <div className={`mt-2 flex items-center justify-end gap-1 text-[11px] ${isMe ? "text-slate-800/70" : "text-slate-400"}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isMe && statusIcon}
        </div>
      </div>

      {isMe && (
        <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 sm:flex">
          <MessageActions message={message} onReply={onReply} onReact={onReact} onDelete={onDelete} isMe={isMe} quickReactions={quickReactions} />
        </div>
      )}
    </motion.div>
  );
}

function renderHighlightedText(text = "", query = "") {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-300/80 px-0.5 text-slate-950">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

export default memo(MessageBubble);

function MessageActions({ message, onReply, onReact, onDelete, isMe = false, quickReactions = ["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02"] }) {
  if (message.deleted) return null;

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/80 p-1 shadow-xl backdrop-blur-xl">
      <button title="Reply" onClick={() => onReply?.(message)} className="rounded-xl p-2 text-slate-300 hover:bg-white/10">
        <CornerUpLeft size={15} />
      </button>

      <div className="hidden items-center gap-0.5 sm:flex">
        {quickReactions.map((emoji) => (
          <button key={emoji} title="React" onClick={() => onReact?.(message._id, emoji)} className="rounded-xl px-1.5 py-1 text-sm hover:bg-white/10">
            {emoji}
          </button>
        ))}
      </div>

      <button title="React" onClick={() => onReact?.(message._id, "\uD83D\uDE0A")} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 sm:hidden">
        <Smile size={15} />
      </button>

      {isMe && (
        <button title="Delete" onClick={() => onDelete?.(message._id)} className="rounded-xl p-2 text-rose-200 hover:bg-rose-500/15">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
