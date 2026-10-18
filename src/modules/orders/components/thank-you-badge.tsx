import { cn } from 'cn'

/**
 * Selo do recibo: envelope com o agradecimento, no mesmo traço do restante
 * dos ícones da marca (contorno em `currentColor`).
 */
export function ThankYouBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 44"
      aria-hidden="true"
      className={cn('text-primary', className)}
      fill="none"
    >
      <rect
        x="7"
        y="11"
        width="34"
        height="31"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 13.5 L24 26 L41 13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="24"
        y="33.5"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="6.2"
        fontWeight="700"
      >
        THANK
      </text>
      <text
        x="24"
        y="40"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="6.2"
        fontWeight="700"
      >
        YOU
      </text>
      <path d="M24 2 L28 8.5 H26 V12 H22 V8.5 H20 Z" fill="currentColor" />
    </svg>
  )
}
