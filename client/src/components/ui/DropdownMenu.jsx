import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Portal from "./Portal";

const GAP = 10;

function getPosition(anchor, width) {
  if (!anchor) return { top: 0, left: 0 };

  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.min(Math.max(GAP, rect.right - width), viewportWidth - width - GAP);
  const estimatedHeight = 430;
  const below = rect.bottom + GAP;
  const top =
    below + estimatedHeight > viewportHeight
      ? Math.max(GAP, rect.top - estimatedHeight - GAP)
      : below;

  return { top, left };
}

export default function DropdownMenu({
  open,
  anchorRef,
  onClose,
  items = [],
  width = 280,
  label = "Menu",
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return undefined;

    const update = () => setPosition(getPosition(anchorRef.current, width));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open, width]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const target = event.target;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose?.();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose, open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            aria-label={label}
            className="fixed z-[70] max-h-[min(430px,calc(100vh-24px))] overflow-y-auto rounded-2xl border border-white/10 bg-[#101114]/95 p-1.5 shadow-2xl shadow-black/50 outline-none backdrop-blur-2xl"
            style={{ top: position.top, left: position.left, width }}
          >
            {items.map(({ id, label: itemLabel, icon: Icon, danger, muted, divider }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  itemLabel && onClose?.();
                  itemLabel && items.find((item) => item.id === id)?.onSelect?.();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  divider ? "mt-1 border-t border-white/10" : ""
                } ${
                  danger
                    ? "text-rose-200 hover:bg-rose-500/14"
                    : muted
                    ? "text-slate-500"
                    : "text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                {Icon && <Icon size={17} />}
                <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
