"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({ open, onClose, title, description, children, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open, onClose]);
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[80] grid place-items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`surface-card max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] p-5 sm:rounded-[30px] sm:p-7 ${widths[size]}`} initial={{ opacity: 0, y: 30, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} transition={{ type: "spring", stiffness: 340, damping: 30 }}><div className="mb-6 flex items-start justify-between gap-5"><div><h2 id="dialog-title" className="text-xl font-bold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div><button onClick={onClose} aria-label="ปิด" className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--muted-soft)] transition-transform hover:rotate-6"><X size={18} /></button></div>{children}</motion.section></motion.div>}</AnimatePresence>;
}
