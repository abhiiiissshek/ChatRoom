import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import Portal from "./Portal";
import IconButton from "./IconButton";

export default function Modal({ open, title, children, onClose, className = "" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6"
            onPointerDown={(event) => {
              if (!panelRef.current?.contains(event.target)) onClose?.();
            }}
          >
            <motion.section
              ref={panelRef}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`max-h-[calc(100vh-24px)] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#101114] shadow-2xl shadow-black/50 ${className}`}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{title}</h2>
                <IconButton title="Close" onClick={onClose} className="h-9 w-9 rounded-xl">
                  <X size={16} />
                </IconButton>
              </div>
              {children}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
