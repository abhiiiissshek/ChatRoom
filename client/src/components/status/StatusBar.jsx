import { Plus } from "lucide-react";
import Avatar from "../ui/Avatar";

export default function StatusBar({ user, groups, onCreate, onOpen }) {
  return (
    <div className="border-b border-white/10 px-3 py-3">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={onCreate}
          className="group flex w-[66px] shrink-0 flex-col items-center gap-2 text-center"
        >
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-cyan-300/45 bg-cyan-300/10 text-cyan-100 transition group-hover:bg-cyan-300/18">
            <Avatar src={user.photoURL} name={user.name} />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-cyan-300 text-zinc-950 ring-4 ring-slate-950">
              <Plus size={14} />
            </span>
          </span>
          <span className="w-full truncate text-[11px] font-medium text-slate-400">Your status</span>
        </button>

        {groups.map((item) => {
          const hasUnseen = item.statuses.some((status) => !status.seenBy?.some((seen) => seen.userId === user.uid));
          return (
            <button
              type="button"
              key={item.user.uid}
              onClick={() => onOpen(item)}
              className="flex w-[66px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span
                className={`rounded-2xl p-[2px] ${
                  hasUnseen ? "bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-emerald-300" : "bg-white/12"
                }`}
              >
                <span className="block rounded-[14px] bg-slate-950 p-[2px]">
                  <Avatar src={item.user.photoURL} name={item.user.name} />
                </span>
              </span>
              <span className="w-full truncate text-[11px] font-medium text-slate-400">{item.user.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
