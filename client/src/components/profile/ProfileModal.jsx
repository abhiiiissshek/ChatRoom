import {
  Bell,
  BellOff,
  Image,
  Lock,
  MessageSquare,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatLastSeen } from "../../utils/formatTime";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export default function ProfileModal({
  open,
  profile,
  currentUser,
  isSelf = false,
  onClose,
  onSave,
  sharedMediaCount = 0,
  mutualChats = [],
  blockedUsers = [],
}) {
  const [draft, setDraft] = useState(profile || {});

  useEffect(() => {
    setDraft(profile || {});
  }, [profile?.uid]);

  const status = useMemo(() => {
    if (profile?.isOnline) return "Online";
    return formatLastSeen(profile?.lastSeen);
  }, [profile?.uid]);

  if (!profile) return null;

  return (
    <Modal open={open} onClose={onClose} title={isSelf ? "Profile Settings" : "Profile"} className="max-w-3xl">
      <div className="max-h-[calc(100vh-90px)] overflow-y-auto">
        <div className="relative h-40 border-b border-white/10 bg-gradient-to-br from-cyan-500/20 via-zinc-900 to-violet-500/20">
          {draft.bannerURL && (
            <img src={draft.bannerURL} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-transparent to-black/20" />
          <div className="absolute -bottom-10 left-5 flex items-end gap-4">
            <Avatar src={draft.photoURL || draft.profilePic} name={draft.name} size="lg" className="h-20 w-20 rounded-3xl" />
            <div className="pb-3">
              <h3 className="text-lg font-semibold text-white">{draft.name || currentUser?.name || "User"}</h3>
              <p className="text-sm text-slate-400">@{draft.username || "user"} - {status}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-5 pb-5 pt-16 md:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            {isSelf ? (
              <>
                <Field label="Avatar URL" icon={UserRound}>
                  <input value={draft.photoURL || ""} onChange={(event) => setDraft((value) => ({ ...value, photoURL: event.target.value }))} className="profile-input" />
                </Field>
                <Field label="Banner URL" icon={Image}>
                  <input value={draft.bannerURL || ""} onChange={(event) => setDraft((value) => ({ ...value, bannerURL: event.target.value }))} className="profile-input" />
                </Field>
                <Field label="Bio" icon={MessageSquare}>
                  <textarea value={draft.bio || ""} onChange={(event) => setDraft((value) => ({ ...value, bio: event.target.value }))} rows={4} className="profile-input min-h-28 resize-none" />
                </Field>
              </>
            ) : (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
                <p className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-slate-300">
                  {profile.bio || "No bio yet."}
                </p>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-2">
              <InfoTile icon={MessageSquare} label="Shared media/files" value={`${sharedMediaCount}`} />
              <InfoTile icon={Users} label="Mutual chats/groups" value={mutualChats.length ? mutualChats.join(", ") : "None yet"} />
            </section>
          </div>

          <div className="space-y-3">
            <Preference icon={Lock} title="Privacy" description={isSelf ? "Last seen, profile photo, and call visibility." : "Default privacy applies."} />
            <Preference icon={draft.notificationsMuted ? BellOff : Bell} title="Notifications" description={draft.notificationsMuted ? "Muted" : "Enabled"} />
            <Preference icon={Shield} title="Blocked users" description={`${blockedUsers.length} blocked`} />

            {isSelf && (
              <Button onClick={() => onSave?.(draft)} className="mt-2 w-full">
                Save Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={14} />
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <Icon size={18} className="mb-3 text-cyan-200" />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function Preference({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon size={16} />
        {title}
      </div>
      <p className="text-sm leading-5 text-slate-400">{description}</p>
    </div>
  );
}
