import { hexToRgba } from "@/lib/color-palette";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function KpiCard({ label, value, sub, icon, accent = "#6366F1" }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-cardborder bg-white px-5 py-5">
      {icon && (
        <div
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-[9px]"
          style={{ backgroundColor: hexToRgba(accent, 0.12), color: accent }}
        >
          {icon}
        </div>
      )}
      <div className="text-xs font-semibold uppercase tracking-wide text-[#888]">{label}</div>
      <div className="text-[28px] font-extrabold leading-none text-navy">{value}</div>
      {sub && <div className="text-xs font-semibold text-success">{sub}</div>}
    </div>
  );
}
