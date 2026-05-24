import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        primary: "bg-forest-700 text-cream [a]:hover:bg-forest-800",
        default: "bg-forest-700 text-cream [a]:hover:bg-forest-800",
        secondary: "bg-wood-600 text-cream [a]:hover:bg-wood-700",
        success: "bg-forest-100 text-forest-800 [a]:hover:bg-forest-200",
        warning: "bg-wood-100 text-wood-800 [a]:hover:bg-wood-200",
        destructive: "bg-ember text-cream [a]:hover:bg-ember/90",
        outline:
          "border-wood-600/40 text-ink [a]:hover:bg-wood-100",
        ghost: "text-ink hover:bg-wood-100 hover:text-wood-800",
        link: "text-forest-700 underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
