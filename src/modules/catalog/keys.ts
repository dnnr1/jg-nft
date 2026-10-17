import type { CatalogRequestParams } from './types'

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (params: CatalogRequestParams) =>
    [...catalogKeys.lists(), params] as const,
}
