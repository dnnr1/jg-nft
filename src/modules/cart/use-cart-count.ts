import { useQuery } from '@tanstack/react-query'

import { cartQuery } from './queries'

/**
 * Total de edições no carrinho, usado pelos badges do header e do dock.
 * A consulta só é habilitada no cliente para não disparar requisições no SSR —
 * o primeiro render (servidor e hidratação) fica sem badge, sem divergência.
 */
export function useCartCount(): number {
  const { data } = useQuery({
    ...cartQuery(),
    enabled: typeof window !== 'undefined',
  })
  return data?.summary.editions ?? 0
}
