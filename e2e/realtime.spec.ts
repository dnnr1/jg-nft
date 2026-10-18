import { expect, test } from '@playwright/test'

/**
 * Fluxos de tempo real (`socket.io-client` conversando com o servidor Socket.IO
 * simulado do MSW).
 *
 * A suíte sobe o servidor de desenvolvimento com
 * `VITE_MOCK_SCENARIO=nft-price-change,order-refused`, então:
 * - o preço do primeiro item do carrinho muda sozinho depois de
 *   `VITE_MOCK_SCENARIO_DELAY_MS`;
 * - um pedido novo nasce pendente e é recusado depois do mesmo atraso.
 *
 * O `data-testid` usado nas asserções é o mesmo contrato que os testes de
 * regressão visual reaproveitam.
 */

const DEMO_EMAIL = 'test123@gmail.com'
const DEMO_PASSWORD = '12345678'

/**
 * Cada caso começa com os mocks no estado de semente: o servidor de
 * desenvolvimento é compartilhado por todos os testes do projeto, então sem
 * este reset um preço alterado ou um pedido criado em um caso vazaría no
 * seguinte. `page.request` não passa pela intercepção do MSW no navegador,
 * então chega direto ao handler `__mock-reset`.
 */
test.beforeEach(async ({ request }) => {
  await request.post('/__mock-reset')
})

test.describe('tempo real', () => {
  test('atualiza o resumo do carrinho quando o preço muda', async ({
    page,
  }) => {
    await page.goto('/cart')

    const total = page.getByTestId('cart-summary-total')
    await expect(total).toBeVisible()
    const previousTotal = (await total.textContent()) ?? ''

    const notice = page.getByTestId('quote-changes-notice')
    await expect(notice).toBeVisible({ timeout: 20_000 })
    await expect(notice).toContainText('passou de')
    await expect(notice).toContainText('para')
    await expect(notice).toContainText('ETH')

    // O resumo exibido é recalculado com o preço recebido pelo socket.
    await expect(total).not.toHaveText(previousTotal)
  })

  test('leva o pedido de pendente a recusado pelo evento order.updated', async ({
    page,
  }) => {
    // Espera a mudança de preço antes de confirmar: a cotação revisada passa a
    // ser a mais recente e o cenário deixa de ser uma corrida.
    await page.goto('/cart')
    await expect(page.getByTestId('quote-changes-notice')).toBeVisible({
      timeout: 20_000,
    })

    // O checkout exige sessão: sem ela a tela volta ao carrinho com o login.
    await page.goto('/checkout')
    const dialog = page.getByRole('dialog', { name: 'Entrar na plataforma' })
    await expect(dialog).toBeVisible()

    await dialog.locator('#login-email').fill(DEMO_EMAIL)
    await dialog.locator('#login-password').fill(DEMO_PASSWORD)
    await dialog
      .locator('form[aria-label="Formulário de login"]')
      .getByRole('button', { name: 'Entrar' })
      .click()

    // O login retoma o checkout de onde o usuário parou.
    await expect(page).toHaveURL(/\/checkout$/)

    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeVisible()
    await confirm.click()

    await expect(page).toHaveURL(/\/orders\//, { timeout: 20_000 })

    const status = page.getByTestId('order-status')
    await expect(status).toHaveText('Estamos confirmando sua transação')
    await expect(status).toHaveText('Não foi possível concluir o pedido', {
      timeout: 20_000,
    })
  })
})
