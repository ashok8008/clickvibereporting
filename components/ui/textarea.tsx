import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[#D1D5DB] bg-[#F8F9FF] px-3 py-2 text-sm text-navy outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-indigo focus:bg-white",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
