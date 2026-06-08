import * as React from "react";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-palette";

export function Badge({
  className,
  color,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  const style = color
    ? { backgroundColor: hexToRgba(color, 0.12), color }
    : undefined;
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        !color && "bg-[#F0F2FA] text-[#4B5563]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
