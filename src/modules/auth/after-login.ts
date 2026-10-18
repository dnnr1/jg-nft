const STORAGE_KEY = 'kurio.after-login'

/**
 * Intenção de retomada: quando um visitante tenta abrir uma rota que exige
 * sessão (checkout, perfil, carteiras), guardamos o destino para devolvê-lo ao
 * fluxo assim que entrar — é o "preservar o contexto para retomada" previsto no
 * enunciado.
 *
 * O valor vive em `sessionStorage` para sobreviver à navegação que acompanha a
 * abertura do diálogo de login, e é consumido (lido e limpo) uma única vez.
 */
export function rememberAfterLogin(path: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    // Armazenamento indisponível: a retomada simplesmente não acontece.
  }
}

export function consumeAfterLoginPath(): string | null {
  try {
    const path = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    return path && path.startsWith('/') ? path : null
  } catch {
    return null
  }
}
