import clsx from "clsx";

export default function StatusDot({ online = false, className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-slate-950",
        online ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.7)]" : "bg-slate-500",
        className
      )}
    />
  );
}
