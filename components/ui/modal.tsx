"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/45 p-4 py-10">
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-white shadow-[0_16px_60px_rgba(13,27,75,0.25)]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-cardborder px-6 py-4">
          <div>
            {title && <h2 className="text-lg font-extrabold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[#6B7280]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-[#F0F2FA] hover:text-navy"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
