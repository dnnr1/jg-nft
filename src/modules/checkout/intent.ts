const STORAGE_KEY = 'kurio.resume-checkout'

/**
 * Intenção de retomada do checkout. Quando um visitante tenta abrir
 * `/checkout` sem sessão, guardamos o propósito de finalizar a compra para
 * levá-lo de volta ao checkout assim que ele entrar — é o "preservar o
 * contexto para retomada" previsto no enunciado.
 *
 * O flag vive em `sessionStorage` para sobreviver à navegação que acompanha a
 * abertura do diálogo de login, e é consumido (lido e limpo) uma única vez.
 */
export function requestCheckoutAfterLogin(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Armazenamento indisponível: a retomada simplesmente não acontece.
  }
}

export function consumeCheckoutIntent(): boolean {
  try {
    const requested = window.sessionStorage.getItem(STORAGE_KEY) === '1'
    window.sessionStorage.removeItem(STORAGE_KEY)
    return requested
  } catch {
    return false
  }
}
