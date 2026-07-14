import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/20",
        secondary:
          "border border-slate-200/90 bg-white/90 text-ink hover:bg-brand-soft hover:border-brand/20 shadow-sm",
        outline: "border border-slate-200/90 bg-white/70 text-ink-secondary hover:bg-brand-soft",
        ghost: "text-ink-secondary hover:bg-slate-100/90",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 rounded-lg px-2.5 text-xs",
        lg: "h-9 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
