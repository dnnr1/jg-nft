import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

interface SelectProps extends React.ComponentProps<"select"> {
  /** Classes do contêiner que posiciona o chevron. */
  containerClassName?: string
}

/**
 * Select nativo alinhado ao Input do projeto (mesma altura, borda e raio).
 * Sem valor selecionado o texto usa o tom de placeholder, como na referência.
 */
function Select({ className, containerClassName, ...props }: SelectProps) {
  const isPlaceholder = props.value === "" || props.value === undefined

  return (
    <span className={cn("relative block w-full", containerClassName)}>
      <select
        data-slot="select"
        className={cn(
          "h-9 w-full min-w-0 cursor-pointer appearance-none rounded-[10px] border border-input bg-ink/60 py-1 pr-9 pl-2.5 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-text-secondary/50 focus-visible:border-[1.5px] focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          isPlaceholder && "text-text-secondary/50",
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-sand"
      />
    </span>
  )
}

export { Select }
