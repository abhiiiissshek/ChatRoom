export default function Button({
  children,
  onClick,
  className = "",
  type = "button",
  variant = "primary",
  title,
  disabled = false,
}) {
  const variants = {
    primary:
      "bg-cyan-300 text-zinc-950 shadow-lg shadow-cyan-500/15 hover:bg-cyan-200",
    ghost: "bg-white/[0.07] text-slate-100 hover:bg-white/[0.12]",
    danger: "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
