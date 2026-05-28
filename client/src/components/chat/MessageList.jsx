import { useMemo } from "react";
import MessageBubble from "./MessageBubble";
import { groupMessagesByDate } from "../../utils/groupMessages";

export default function MessageList({
  messages,
  user,
  bottomRef,
  onReply,
  onDelete,
  onReact,
  onSeen,
  searchQuery = "",
}) {
  const visibleMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) =>
      (message.text || message.replyToText || "").toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const grouped = useMemo(() => groupMessagesByDate(visibleMessages), [visibleMessages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-6 md:py-5">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
          No messages yet
        </div>
      )}

      {messages.length > 0 && visibleMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
          No matching messages
        </div>
      )}

      {Object.entries(grouped).map(([label, items]) => (
        <section key={label} className="space-y-2.5 md:space-y-3">
          <div className="sticky top-2 z-10 my-4 flex justify-center">
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs text-slate-400 backdrop-blur">
              {label}
            </span>
          </div>

          {items.map((message) => (
            <MessageBubble
              key={message._id || `${message.from}-${message.createdAt}`}
              message={message}
              isMe={message.from === user.uid}
              onReply={onReply}
              onDelete={onDelete}
              onReact={onReact}
              onSeen={onSeen}
              searchQuery={searchQuery}
            />
          ))}
        </section>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
