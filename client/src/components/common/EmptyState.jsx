export default function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <div>
        {icon && (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-200 shadow-xl shadow-black/20">
            {icon}
          </div>
        )}
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && (
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
