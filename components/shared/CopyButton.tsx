"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-cardborder bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-[#F0F2FA]"
    >
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      {label ?? (copied ? "Copied" : "Copy")}
    </button>
  );
}
