export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
