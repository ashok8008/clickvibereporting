import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 font-[inherit] cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-indigo text-white hover:bg-indigo-dark",
        outline: "bg-white text-indigo border border-indigo hover:bg-[#F5F3FF]",
        green: "bg-success text-white hover:bg-[#16A34A]",
        navy: "bg-navy text-white hover:bg-[#16245f]",
        ghost: "bg-transparent text-navy hover:bg-[#F0F2FA]",
        danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2",
        lg: "px-5 py-3",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
