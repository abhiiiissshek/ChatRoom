import { ArrowLeft, BellOff, MoreVertical, Phone, Pin, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import StatusDot from "../common/StatusDot";
import { formatLastSeen } from "../../utils/formatTime";
import ChatMenu from "./ChatMenu";

export default function ChatHeader({
  activeChat,
  presence,
  isTyping,
  onBack,
  onMenuAction,
  onStartVoiceCall,
  onStartVideoCall,
  menuState,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const status = presence?.[activeChat.uid];
  const isOnline = status?.isOnline ?? activeChat.isOnline;

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Escape") setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, menuOpen]);

  return (
    <header className="relative flex h-20 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/75 px-3 backdrop-blur-xl md:px-5">
      <IconButton title="Back to chats" onClick={onBack} className="md:hidden">
        <ArrowLeft size={19} />
      </IconButton>

      <div className="relative">
        <Avatar src={activeChat.photoURL} name={activeChat.name} size="lg" />
        <StatusDot online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="flex min-w-0 items-center gap-2 font-semibold text-white">
          {menuState?.pinned && <Pin size={14} className="shrink-0 text-amber-200" />}
          <span className="truncate">{activeChat.name}</span>
        </h2>

        <p className="flex min-w-0 items-center gap-2 truncate text-sm text-slate-400">
          {menuState?.muted && <BellOff size={13} className="shrink-0" />}
          <span className="truncate">
            {isTyping ? "typing..." : isOnline ? "Online" : formatLastSeen(status?.lastSeen || activeChat.lastSeen)}
          </span>
        </p>
      </div>

      {!activeChat.isGroup && (
        <div className="flex items-center gap-2">
          <IconButton title="Voice call" onClick={onStartVoiceCall}>
            <Phone size={18} />
          </IconButton>

          <IconButton title="Video call" onClick={onStartVideoCall}>
            <Video size={18} />
          </IconButton>
        </div>
      )}

      <div className="relative">
        <IconButton
          ref={menuButtonRef}
          title="Chat options"
          onClick={() => setMenuOpen((value) => !value)}
          className={menuOpen ? "bg-white/[0.14]" : ""}
        >
          <MoreVertical size={19} />
        </IconButton>

        <ChatMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onAction={(action) => onMenuAction?.(action, activeChat)}
          anchorRef={menuButtonRef}
          state={menuState}
        />
      </div>
    </header>
  );
}
