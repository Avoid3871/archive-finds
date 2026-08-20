"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";

export function ContentProtectionShield() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // 1. Prevent Right-Click Context Menu on public pages
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right click if user is in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      e.preventDefault();
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 2500);
    };

    // 2. Prevent Dragging Images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.closest("img")) {
        e.preventDefault();
      }
    };

    // 3. Prevent Save Page / Print / Source Shortcuts (Ctrl+S, Ctrl+U, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")
      ) {
        e.preventDefault();
        setShowNotice(true);
        setTimeout(() => setShowNotice(false), 2500);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="px-4 py-2.5 bg-black/90 backdrop-blur-md border border-neutral-800 text-white rounded-full shadow-2xl flex items-center gap-2.5 font-mono text-xs">
        <Lock className="w-3.5 h-3.5 text-neutral-400" />
        <span className="tracking-wider uppercase font-bold text-[11px] text-neutral-200">
          AF // PROTECTED ARCHIVE CONTENT
        </span>
      </div>
    </div>
  );
}
