import type { SVGProps } from 'react'

export function IconBase({
  children,
  viewBox,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      {...props}
    >
      {children}
    </svg>
  )
}
