const emojis = [
  "\uD83D\uDE00",
  "\uD83D\uDE02",
  "\uD83D\uDE0D",
  "\uD83D\uDD25",
  "\u2764\uFE0F",
  "\uD83D\uDC4D",
  "\uD83C\uDF89",
  "\uD83D\uDE0E",
  "\uD83E\uDD29",
  "\uD83D\uDE2D",
  "\u2728",
  "\uD83D\uDE4C",
  "\uD83D\uDCAF",
  "\uD83E\uDD1D",
  "\uD83D\uDC40",
];

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="absolute bottom-full left-3 mb-3 grid w-[260px] grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="rounded-xl p-2 text-xl transition hover:bg-white/10"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
