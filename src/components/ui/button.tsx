import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/btn inline-flex shrink-0 cursor-pointer items-center justify-center select-none whitespace-nowrap font-mono font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-ink font-bold shadow-xs hover:bg-primary-light active:bg-primary-dark",
        secondary:
          "border border-border-soft bg-surface-card text-foreground hover:border-border-soft hover:bg-surface-raised active:bg-surface-dark",
        outline:
          "border border-border bg-transparent text-foreground hover:border-border-soft hover:bg-surface-card active:bg-surface-raised",
        ghost: "bg-transparent text-foreground hover:bg-surface-raised active:bg-surface-dark",
        danger:
          "bg-error font-medium text-white hover:bg-error/90 focus-visible:ring-error active:bg-error/80",
        pill: "rounded-pill bg-primary font-bold text-ink hover:bg-primary-light active:bg-primary-dark",
        link: "text-text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 rounded-default px-4 text-sm",
        lg: "h-12 gap-2.5 rounded-default px-6 text-base",
        sm: "h-9 gap-1.5 rounded-sm px-3 py-2 text-xs",
        xsm: "h-8 gap-1.5 rounded-sm px-3 text-xs",
        icon: "size-10 rounded-default",
        "icon-sm": "size-8 rounded-default",
        full: "h-10 w-full gap-2 rounded-default px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-disabled={props.disabled || props["aria-disabled"]}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
