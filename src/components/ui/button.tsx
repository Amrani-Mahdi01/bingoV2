import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { WoodGrainPattern } from "@/components/decorative/WoodGrainPattern";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — forest-700 (brand green)
        primary:
          "bg-forest-700 text-cream shadow-sm hover:bg-forest-800 active:bg-forest-900",
        // Default mirrors primary so shadcn-internal usages stay branded
        default:
          "bg-forest-700 text-cream shadow-sm hover:bg-forest-800 active:bg-forest-900",
        // Secondary — wood-600 with WoodGrainPattern overlay
        secondary:
          "bg-wood-600 text-cream shadow-sm hover:bg-wood-700 active:bg-wood-800",
        // Ghost — transparent, hover wood-100
        ghost: "text-ink hover:bg-wood-100 hover:text-wood-800",
        // Outline — wood-600 border, cream bg
        outline:
          "border-wood-600/40 bg-cream text-ink hover:bg-wood-100 hover:border-wood-600",
        // Destructive — solid ember
        destructive:
          "bg-ember text-cream shadow-sm hover:bg-ember/90 active:bg-ember/80 focus-visible:ring-destructive/30",
        // Link — forest underline-on-hover
        link: "text-forest-700 underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-9 gap-1.5 rounded-md px-3 text-xs",
        default: "h-11 gap-2 px-5 text-sm",
        lg: "h-12 gap-2 rounded-md px-7 text-base",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "primary",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  const showGrain = variant === "secondary";
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {showGrain ? <WoodGrainPattern opacity={0.18} seed="btn" /> : null}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
