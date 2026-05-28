export default function AIChips({ suggestions, onSelect }) {
  if (!suggestions?.length) return null;

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-slate-950/45 px-4 py-3">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onSelect(suggestion)}
          className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.12]"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
