"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DATE_PRESETS, type DatePreset } from "@/lib/date-ranges";

interface Props {
  preset: DatePreset;
  from: string;
  to: string;
  onPresetChange: (preset: DatePreset) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onApply: () => void;
  applying?: boolean;
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#6B7280]">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        className="cursor-pointer"
      >
        <Input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-auto min-w-[150px] pointer-events-auto"
        />
      </div>
    </div>
  );
}

export function DateRangePicker({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
  onApply,
  applying = false,
}: Props) {
  const canApply = Boolean(from && to);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-cardborder bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange(p.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === p.id
                ? "bg-navy text-white"
                : "bg-[#F8F9FF] text-[#6B7280] hover:bg-[#EEF0FF] hover:text-navy"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <DateField label="From" value={from} onChange={onFromChange} />
        <DateField label="To" value={to} onChange={onToChange} />
        <Button onClick={onApply} disabled={applying || !canApply}>
          {applying ? "Loading…" : "Apply"}
        </Button>
      </div>
    </div>
  );
}
