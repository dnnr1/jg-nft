import { defineConfig, devices } from '@playwright/test'

/**
 * Porta dedicada dos testes: evita reutilizar o servidor de desenvolvimento do
 * dia a dia (que roda sem os cenários de tempo real ligados).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      /**
       * Cenários de tempo real usados pela suíte. O preço do primeiro item do
       * carrinho muda e o pedido nasce pendente até ser recusado, sempre depois
       * de `VITE_MOCK_SCENARIO_DELAY_MS` — o suficiente para a asserção alcançar
       * o estado anterior.
       */
      VITE_MOCK_SCENARIO:
        process.env.VITE_MOCK_SCENARIO ??
        'nft-price-change,order-refused',
      VITE_MOCK_SCENARIO_DELAY_MS: process.env.VITE_MOCK_SCENARIO_DELAY_MS ?? '2500',
    },
  },
})
