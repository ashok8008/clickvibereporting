"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 border-b border-cardborder", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative -mb-px px-4 py-2.5 text-sm font-semibold transition-colors",
            active === t.id
              ? "border-b-2 border-indigo text-navy"
              : "text-[#6B7280] hover:text-navy"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
