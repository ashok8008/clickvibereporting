import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[#D1D5DB] bg-[#F8F9FF] px-3 py-2 text-sm text-navy outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-indigo focus:bg-white",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
