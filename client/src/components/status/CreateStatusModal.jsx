import { Image, Type, Video } from "lucide-react";
import { useState } from "react";
import Modal from "../ui/Modal";

const backgrounds = ["#0f172a", "#172554", "#164e63", "#14532d", "#4c0519", "#312e81"];

export default function CreateStatusModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [privacy, setPrivacy] = useState("everyone");
  const [background, setBackground] = useState(backgrounds[0]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    await onSubmit({ text: text.trim(), file, privacy, background });
    setText("");
    setFile(null);
    setPrivacy("everyone");
    onClose();
  };

  return (
    <Modal open={open} title="Create status" onClose={onClose} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="flex aspect-[9/14] max-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 p-5 text-center" style={{ background }}>
          {file ? (
            file.type.startsWith("video") ? (
              <video src={URL.createObjectURL(file)} controls className="h-full w-full rounded-xl object-cover" />
            ) : (
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full rounded-xl object-cover" />
            )
          ) : (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="What's happening?"
              className="h-full w-full resize-none bg-transparent text-center text-2xl font-semibold text-white outline-none placeholder:text-white/45"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {backgrounds.map((color) => (
            <button
              type="button"
              key={color}
              onClick={() => setBackground(color)}
              className="h-8 w-8 rounded-full border border-white/20"
              style={{ background: color }}
              aria-label="Status background"
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-200 transition hover:bg-white/[0.1]">
            <Image size={16} />
            <Video size={16} />
            <span>Media</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>

          <label className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-200">
            <Type size={16} />
            <select value={privacy} onChange={(event) => setPrivacy(event.target.value)} className="bg-transparent text-sm outline-none">
              <option className="bg-zinc-950" value="everyone">Everyone</option>
              <option className="bg-zinc-950" value="contacts">Contacts</option>
              <option className="bg-zinc-950" value="onlyMe">Only me</option>
            </select>
          </label>
        </div>

        <button type="submit" className="h-11 w-full rounded-2xl bg-cyan-300 font-semibold text-zinc-950 transition hover:bg-cyan-200">
          Share status
        </button>
      </form>
    </Modal>
  );
}
