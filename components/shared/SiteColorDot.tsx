import { hexToRgba } from "@/lib/color-palette";

export function SiteColorDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block flex-shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

export function SitePill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: hexToRgba(color, 0.12), color }}
    >
      <SiteColorDot color={color} size={8} />
      {name}
    </span>
  );
}
