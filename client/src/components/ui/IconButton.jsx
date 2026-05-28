import { forwardRef } from "react";

function IconButton({
  children,
  title,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-slate-200 transition hover:bg-white/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default forwardRef(IconButton);
