import { Paperclip, Send, Smile, X } from "lucide-react";
import { useRef, useState } from "react";
import IconButton from "../ui/IconButton";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

export default function Composer({
  text,
  onTextChange,
  sendMessage,
  onUpload,
  replyTo,
  onCancelReply,
  onVoiceSend,
  disabled = false,
  blocked = false,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <footer className="relative shrink-0 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-xl md:p-4">
      {replyTo && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-cyan-200">Replying to message</p>
            <p className="truncate text-sm text-slate-300">{replyTo.text || "[media]"}</p>
          </div>
          <IconButton title="Cancel reply" onClick={onCancelReply} className="h-9 w-9 rounded-xl">
            <X size={16} />
          </IconButton>
        </div>
      )}

      {emojiOpen && <EmojiPicker onSelect={(emoji) => onTextChange(text + emoji)} />}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />

        <IconButton title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
          <Paperclip size={19} />
        </IconButton>

        <IconButton title="Emoji" onClick={() => setEmojiOpen((value) => !value)} disabled={disabled} className="hidden sm:inline-flex">
          <Smile size={19} />
        </IconButton>

        <div className="hidden sm:block">
          <VoiceRecorder onSend={onVoiceSend} disabled={disabled} />
        </div>

        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={blocked ? "You blocked this user" : "Type a message"}
          className="h-11 max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/[0.1]"
        />

        <IconButton
          title="Send message"
          onClick={sendMessage}
          disabled={disabled || !text.trim()}
          className="bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
        >
          <Send size={19} />
        </IconButton>
      </div>
    </footer>
  );
}
