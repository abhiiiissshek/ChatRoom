export default function SkeletonList({ rows = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
