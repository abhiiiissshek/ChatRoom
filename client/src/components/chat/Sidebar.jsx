import { Archive, BellOff, LogOut, Pin, RefreshCcw, Search, UserRoundPlus, Users, Video } from "lucide-react";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import SkeletonList from "../ui/Skeleton";
import StatusDot from "../common/StatusDot";
import { formatTime } from "../../utils/formatTime";
import StatusBar from "../status/StatusBar";

export default function Sidebar({
  user,
  conversations,
  activeChat,
  onSelectChat,
  search,
  setSearch,
  doSearch,
  results,
  onSignOut,
  onRefresh,
  loading,
  pinnedChatIds = [],
  mutedChatIds = [],
  archivedCount = 0,
  onOpenProfile,
  statusGroups = [],
  onCreateStatus,
  onOpenStatus,
  onCreateGroup,
  onCreateMeeting,
}) {
  const unreadTotal = conversations.reduce((total, item) => total + (item.unreadCount || 0), 0);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-slate-950/70 backdrop-blur-2xl md:w-[370px]">
      <div className="border-b border-white/10 p-4">
        <div className="mb-5 flex items-center gap-3">
          <button type="button" onClick={onOpenProfile} className="rounded-2xl outline-none focus:ring-2 focus:ring-cyan-300/50">
            <Avatar src={user.photoURL} name={user.name} size="lg" />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-white">{user.name}</h2>
            <p className="truncate text-sm text-slate-400">@{user.username}</p>
          </div>

          <IconButton title="Refresh chats" onClick={onRefresh}>
            <RefreshCcw size={18} />
          </IconButton>

          <IconButton title="Create group" onClick={onCreateGroup}>
            <UserRoundPlus size={18} />
          </IconButton>

          <IconButton title="Instant meeting" onClick={onCreateMeeting}>
            <Video size={18} />
          </IconButton>

          <IconButton title="Sign out" onClick={onSignOut} className="text-rose-200 hover:bg-rose-500/15">
            <LogOut size={18} />
          </IconButton>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            doSearch();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/[0.1]"
            />
          </div>

          <IconButton title="Search" type="submit" className="bg-cyan-300 text-zinc-950 hover:bg-cyan-200">
            <Search size={18} />
          </IconButton>
        </form>
      </div>

      <StatusBar user={user} groups={statusGroups} onCreate={onCreateStatus} onOpen={onOpenStatus} />

      {results.length > 0 && (
        <div className="border-b border-white/10 p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Search results</p>
          {results.map((result) => (
            <button
              key={result.uid}
              onClick={() => {
                onSelectChat(result);
                setSearch("");
              }}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.08]"
            >
              <Avatar src={result.photoURL} name={result.name} />

              <div className="min-w-0">
                <h3 className="truncate font-medium text-white">{result.name}</h3>
                <p className="truncate text-sm text-slate-500">@{result.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Users size={17} />
          <span>Chats</span>
        </div>
        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <span title="Archived chats" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
              <Archive size={12} />
              {archivedCount}
            </span>
          )}
          {unreadTotal > 0 && (
            <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-bold text-zinc-950">{unreadTotal}</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <SkeletonList rows={5} />
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            Search for someone to start a conversation.
          </div>
        ) : (
          conversations.map((conversation) => {
            const participant = conversation.participant;

            return (
              <button
                key={conversation.group?._id || participant.uid}
                onClick={() => onSelectChat(participant)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 ${
                  activeChat?.uid === participant.uid
                    ? "bg-white/[0.12] shadow-lg shadow-black/20"
                    : "hover:bg-white/[0.07]"
                }`}
              >
                <div className="relative">
                  <Avatar src={participant.photoURL} name={participant.name} />
                  <StatusDot online={participant.isOnline} className="absolute -bottom-0.5 -right-0.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex min-w-0 items-center gap-1.5 truncate font-medium text-white">
                      {pinnedChatIds.includes(participant.uid) && <Pin size={13} className="shrink-0 text-amber-200" />}
                      {participant.isGroup && <Users size={13} className="shrink-0 text-cyan-200" />}
                      <span className="truncate">{participant.name}</span>
                    </h3>
                    <span className="shrink-0 text-xs text-slate-500">{formatTime(conversation.lastAt)}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    {mutedChatIds.includes(participant.uid) && <BellOff size={13} className="shrink-0 text-slate-500" />}
                    <p className="min-w-0 flex-1 truncate text-sm text-slate-500">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-bold text-zinc-950">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
