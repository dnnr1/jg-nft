/**
 * Cenários do servidor simulado, selecionáveis por variável de ambiente.
 *
 * `VITE_MOCK_SCENARIO` recebe uma lista separada por vírgula, por exemplo:
 *
 * ```
 * VITE_MOCK_SCENARIO=nft-price-change,order-refused
 * ```
 *
 * `VITE_MOCK_SCENARIO_DELAY_MS` controla o atraso entre a conexão (ou a
 * criação do pedido) e a mudança simulada, mantendo os cenários determinísticos
 * para as verificações automatizadas. Sem variável definida nenhum cenário é
 * ligado — a linha de base é o comportamento de um servidor estável.
 */
export const MOCK_SCENARIOS = [
  /** O primeiro item do carrinho fica 15% mais caro enquanto a tela está aberta. */
  'nft-price-change',
  /** O primeiro item do carrinho esgota. */
  'nft-sold-out',
  /** O pedido nasce pendente e é confirmado depois. */
  'order-pending',
  /** O pedido nasce pendente e é recusado depois. */
  'order-refused',
  /**
   * O pedido é criado no servidor, mas a resposta não chega ao cliente — o
   * timeout previsto em §164. A retomada com a mesma chave recupera o pedido.
   */
  'order-timeout',
] as const

export type MockScenario = (typeof MOCK_SCENARIOS)[number]

const DEFAULT_SCENARIO_DELAY_MS = 1500

/**
 * Lê o ambiente do Vite de forma dinâmica.
 *
 * A referência a `import.meta.env` precisa aparecer **literalmente** neste
 * módulo: é assim que o Vite decide injetar o objeto de ambiente no módulo
 * servido em desenvolvimento (e o `define` do build só substitui a expressão
 * literal). No Node — onde rodam as verificações de contrato, fora do bundler —
 * a propriedade não existe, daí o fallback.
 */
function envOf(): Record<string, string | undefined> {
  const env = import.meta.env as Record<string, string | undefined> | undefined
  return env ?? {}
}

export function activeScenarios(): MockScenario[] {
  const raw = envOf().VITE_MOCK_SCENARIO ?? ''
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is MockScenario =>
      (MOCK_SCENARIOS as readonly string[]).includes(value),
    )
}

export function hasScenario(scenario: MockScenario): boolean {
  return activeScenarios().includes(scenario)
}

export function scenarioDelayMs(): number {
  const raw = Number(envOf().VITE_MOCK_SCENARIO_DELAY_MS)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_SCENARIO_DELAY_MS
}

/** Chaves de idempotência que já sofreram o timeout simulado. */
const timedOutAttempts = new Set<string>()

/** Cenários cujo efeito já foi aplicado nesta sessão de mocks. */
const appliedScenarios = new Set<MockScenario>()

/**
 * Reivindica um cenário para si: quem for o primeiro aplica o efeito, quem
 * chegar depois não repete (evita reaplicar a alta de preço a cada reconexão).
 */
export function claimScenario(scenario: MockScenario): boolean {
  if (appliedScenarios.has(scenario)) return false
  appliedScenarios.add(scenario)
  return true
}

/**
 * Decide se esta tentativa de compra deve terminar em timeout.
 *
 * Só a primeira tentativa de cada chave falha: o pedido fica criado no
 * "servidor" e a retomada com a mesma chave o recupera, exatamente como um
 * cliente perderia a resposta sem perder a compra (§192).
 */
export function shouldFailOrderCreation(key: string | null): boolean {
  if (!key || !hasScenario('order-timeout')) return false
  if (timedOutAttempts.has(key)) return false
  timedOutAttempts.add(key)
  return true
}

/** Zera o estado dos cenários com efeito colateral (reset de demonstração). */
export function resetScenarioState(): void {
  timedOutAttempts.clear()
  appliedScenarios.clear()
}
