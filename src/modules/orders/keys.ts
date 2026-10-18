export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}
