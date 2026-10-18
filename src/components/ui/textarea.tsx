import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-40 w-full min-w-0 resize-y rounded-[10px] border border-input bg-ink/60 px-2.5 py-2 font-mono text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-text-secondary/50 focus-visible:border-[1.5px] focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
