import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white shadow-glow hover:bg-accent-hi hover:shadow-[0_0_50px_rgba(124,58,237,0.35)]",
        secondary:
          "bg-elevated text-ink border border-line hover:border-line-strong hover:bg-white/[0.04]",
        ghost: "text-ink-soft hover:text-ink hover:bg-white/[0.04]",
        danger:
          "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
        outline:
          "border border-line bg-transparent text-ink hover:border-accent/40 hover:bg-accent-soft",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-xs rounded-xl",
        lg: "h-12 px-7 text-base rounded-2.5xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
