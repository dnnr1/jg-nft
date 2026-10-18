import { expect, test } from '@playwright/test'

/**
 * Recuperação de pedido pendente quando a resposta da criação se perde
 * (§163, §192).
 *
 * O cenário `order-refused,order-timeout` faz o servidor criar o pedido
 * pendente, mas descartar a primeira resposta HTTP. O cliente repete a
 * confirmação com a mesma chave de idempotência: o servidor recupera o pedido
 * existente (sem criar uma segunda compra) e a conclusão chega pelo evento
 * `order.updated`.
 *
 * Rodar com: `VITE_MOCK_SCENARIO=order-refused,order-timeout npx playwright
 * test e2e/order-timeout.spec.ts`
 */

const DEMO_EMAIL = 'test123@gmail.com'
const DEMO_PASSWORD = '12345678'

test.beforeEach(async ({ request }) => {
  await request.post('/__mock-reset')
})

test.describe('recuperação após timeout', () => {
  test('recupera o mesmo pedido sem criar uma compra dupla', async ({
    page,
  }) => {
    await page.goto('/checkout')

    const dialog = page.getByRole('dialog', { name: 'Entrar na plataforma' })
    await expect(dialog).toBeVisible()

    await dialog.locator('#login-email').fill(DEMO_EMAIL)
    await dialog.locator('#login-password').fill(DEMO_PASSWORD)
    await dialog
      .locator('form[aria-label="Formulário de login"]')
      .getByRole('button', { name: 'Entrar' })
      .click()

    await expect(page).toHaveURL(/\/checkout$/)

    const confirm = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(confirm).toBeVisible()

    // Primeira tentativa: o servidor simula a perda da resposta (timeout).
    await confirm.click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })

    // Mesma chave de idempotência: recupera o pedido já criado.
    await confirm.click()

    await expect(page).toHaveURL(/\/orders\//, { timeout: 20_000 })

    const status = page.getByTestId('order-status')
    // O pedido passa por "Estamos confirmando..." e a conclusão (recusa) chega
    // pelo evento order.updated; o exato momento depende da latência simulada.
    await expect(
      status,
      'o recibo mostra o pedido recuperado e depois o desfecho ao vivo',
    ).toHaveText(/Estamos confirmando|Não foi possível concluir o pedido/, {
      timeout: 15_000,
    })
    await expect(status).toHaveText('Não foi possível concluir o pedido', {
      timeout: 20_000,
    })
  })
})
