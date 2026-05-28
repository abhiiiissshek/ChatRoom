import React from "react";
import clsx from "clsx";

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({ src, name = "User", size = "md", className = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={clsx(
        "shrink-0 overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-300 to-violet-400 font-semibold text-zinc-950">
          {initials || "U"}
        </div>
      )}
    </div>
  );
}
