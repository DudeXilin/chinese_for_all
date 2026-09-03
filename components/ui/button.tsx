import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-white/50 bg-white/25 text-foreground shadow-[0_12px_35px_rgba(80,70,50,0.08)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/35",
        destructive:
          "border border-red-300/40 bg-red-400/20 text-red-900 shadow-sm backdrop-blur-xl hover:bg-red-400/30 dark:text-red-100",
        outline:
          "border border-white/50 bg-white/15 text-foreground shadow-sm backdrop-blur-xl hover:bg-white/30",
        secondary:
          "border border-white/40 bg-white/20 text-foreground shadow-sm backdrop-blur-xl hover:bg-white/30",
        ghost: "hover:bg-white/20 backdrop-blur-xl",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
