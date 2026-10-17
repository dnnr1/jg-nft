import { z } from 'zod'

export const detailSearchSchema = z.object({
  qty: z.coerce.number().int().min(1).max(99).optional(),
})

export type DetailUrlSearch = {
  qty?: number
}

export const DEFAULT_QTY = 1

export function resolveDetailSearch(search: DetailUrlSearch): {
  qty: number
} {
  return { qty: search.qty ?? DEFAULT_QTY }
}
