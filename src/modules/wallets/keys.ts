export const walletsKeys = {
  all: ['wallets'] as const,
  list: () => [...walletsKeys.all, 'list'] as const,
}
