import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[#D1D5DB] bg-[#F8F9FF] px-3 py-2 text-sm text-navy outline-none transition-colors focus:border-indigo focus:bg-white",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
