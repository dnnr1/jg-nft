# TODO de conformidade com o enunciado

Auditoria de `master` @ `dfbf300` contra o `README.md` (Desafio Frontend — Marketplace de NFTs).
Referências no formato §n = seção do enunciado. Cada item traz a evidência encontrada no código.

Legenda: **P0** = eliminatório ou exigido explicitamente e ausente · **P1** = requisito explícito atendido em parte ·
**P2** = verificação/ajuste fino.

---

## P0 — Ausente e exigido explicitamente

### 1. Tempo real com Socket.IO (§2, §6, §7, §64, §71, §163, §185–192, §259, §267)

**Status:** implementado — commit pendente (trabalho em `master` @ `dfbf300`, nada de item 1 estava no remoto).

**Evidência:** `socket.io-client`, `@mswjs/socket.io-binding@0.2.0` e `@playwright/test` estão nas dependências; `.npmrc` define `legacy-peer-deps=true` (conflito de peer do binding com `msw@3.0.3`). O cliente é criado pelo MSW-intercepted WebSocket (`src/mocks/socket.ts`), o aplicador de eventos fica em `src/modules/realtime/apply.ts`, o contrato em `src/modules/realtime/messages.ts` e a sincronização em `src/modules/realtime/realtime-sync.tsx`. Cenários por variável de ambiente em `src/mocks/scenarios.ts`; reset de estado entre testes via `POST /__mock-reset` (`src/mocks/handlers.ts`).

**Falta:** (tudo coberto — ver checkboxes abaixo)

- [x] Servidor simulado de Socket.IO via MSW (`@mswjs/socket.io-binding`), ativado junto dos handlers REST (§166).
- [x] `nft.updated` com identidade estável, recurso afetado e versão (§181) → catálogo, detalhe e carrinho (§64, §177).
- [x] `order.updated` → recibo atualiza para confirmado/recusado (§178).
- [x] Cliente tolerante a duplicatas e eventos antigos (não regride estado, não reaplica efeitos) (§181).
- [x] Reconciliação com REST após reconexão; eventos de sessão anterior não atualizam outro usuário (§183).
- [x] Cleanup de listeners/subscriptions no fim do ciclo de vida (§183).
- [x] Cenário do enunciado: NFT no carrinho → preço/disponibilidade mudam → UI avisa e atualiza o resumo → checkout **impede** confirmar com cotação desatualizada (§185–190).
- [x] Interrupção de conexão com pedido pendente + retomada sem criar outra compra (§192).
- [x] Feedback acessível das alterações em tempo real (§209).

**Verificação:** `e2e/realtime.spec.ts` (4 testes: preço ao vivo no carrinho; pedido pendente→recusado) e `e2e/order-timeout.spec.ts` (2 testes: resposta perdida + recuperação idempotente sem compra dupla), ambos nos projetos desktop e mobile; `scripts/check-realtime.ts` (aplicador puro + QUOTE_CHANGED/idempotência no MSW); `npm run check:mocks` (98 checks).

### 2. Testes E2E com Playwright (§9, §231–235, §261, §267)

**Status:** parcialmente implementado — suíte executável com 6 testes passando em desktop e mobile; commit pendente.

**Evidência:** `@playwright/test@1.64.1` com Chromium em cache, `playwright.config.ts` (projetos desktop/mobile, `webServer` na porta 3100 com `VITE_MOCK_SCENARIO`, reporter HTML, traces/screenshots em falha), `e2e/realtime.spec.ts` e `e2e/order-timeout.spec.ts`, script `test:e2e` no `package.json`.

**Falta:**

- [x] `playwright.config.ts` com projetos desktop e mobile (Chromium), `webServer` subindo o servidor com mocks, relatório HTML, traces/screenshots em falha (§233).
- [ ] Os 12 cenários de §218–229 (catálogo/histórico, detalhe/404, conta/sessão, favoritos, carrinho, compra, falha de pagamento + clique repetido + timeout, perfil/carteiras, socket no checkout, duplicatas/desconexão, teclado/diálogos, skeletons/retry) — cobertos: compra, falha de pagamento + timeout, socket no checkout, duplicatas/desconexão.
- [ ] Regressão visual de início, detalhe, carrinho e pagamento com baselines versionadas (§231).
- [ ] Estado isolado por teste, controle de relógio/latência/eventos (§233) — isolamento entre casos via `POST /__mock-reset`; relógio/latência fixos.
- [x] Scripts `test:e2e` / `report` (§281) — `test:e2e` roda as duas suítes; relatório HTML via `reporter: [['list'], ['html']]`.

### 3. Favoritos (§3 detalhe do NFT, §5 Favoritos, §56, §82)

**Status:** ausente.

**Evidência:** não existe rota `/favorites`, nem endpoints de favoritos em `src/mocks/handlers.ts`; o detalhe
(`src/routes/nfts.$id.tsx`) só adiciona ao carrinho. `favoritesCount` é apenas um número da fixture
(`src/mocks/fixtures/nfts.ts`). O dock mobile tem um botão "Favoritos" (`src/components/layout/mobile-tab-bar.tsx`)
que navega para o perfil/login, e a sidebar da conta marca "Lista de interesse" como fora do escopo
(`src/components/layout/account-sidebar.tsx`).

**Falta:**

- [ ] Recurso REST de favoritos: consulta, inclusão e remoção (§5), com `Authorization` obrigatório.
- [ ] Persistência por usuário autenticado (não global como carteiras/carrinho).
- [ ] Ação de favoritar/desfavoritar no detalhe e no cartão do catálogo, com estado honesto sem sessão
      (abre o login, não finge sucesso — §48).
- [ ] Destino real para a entrada "Lista de interesse" e para o botão "Favoritos" do dock.

> O enunciado exclui da entrega apenas páginas editoriais, suporte, atividade, ofertas e downloads (§48).
> "Favoritos"/"Lista de interesse" **está** no escopo (§56).

### 4. Deploy público com mocks funcionando (§12, §170, §267)

**Status:** a verificar / provavelmente quebrado no build de produção.

**Evidência:** `netlify.toml` só define `command` e `publish`. `mocksEnabled()` (`src/router.tsx`) cai em
`import.meta.env.DEV` quando `VITE_ENABLE_MOCKS` não está definido — em build de produção isso é `false`, ou seja
**sem mocks**. Como toda a API é simulada, a versão publicada fica sem dados, salvo se a variável estiver definida
no painel do Netlify.

**Falta:**

- [ ] Definir `VITE_ENABLE_MOCKS=true` (e `VITE_API_BASE_URL=/api`) em `netlify.toml` (`[build.environment]`) ou
      documentar a configuração do painel.
- [ ] Confirmar URL pública, acesso direto às rotas e refresh funcionando (§275).
- [ ] Confirmar que a versão publicada corresponde ao commit entregue.

### 5. Auditoria Lighthouse (§10, §237–250)

**Status:** ausente.

**Evidência:** sem `lighthouserc.*`, sem `lighthouse/`, sem relatórios HTML/JSON versionados e sem script no
`package.json`.

**Falta:**

- [ ] Configuração versionada (LHCI) para início e detalhe, perfis mobile e desktop, contra build otimizado com
      os mocks padrão (§239).
- [ ] Três medições por página/perfil com mediana reportada, versões das ferramentas e ambiente (§248).
- [ ] Registro de LCP, CLS e TBT com justificativa de eventuais resultados abaixo da meta (§250).
- [ ] Scripts `lighthouse` / `audit` (§281).

---

## P1 — Requisito explícito atendido em parte

### 6. Pedido pendente, recusado e recuperação (§74, §75, §164 + §71 "recusa")

**Evidência:** `ORDER_STATUSES` e o recibo já preveem `pending`/`refused`
(`src/modules/orders/types.ts`, `src/modules/orders/components/order-confirmation.tsx`), mas
`src/mocks/order-store.ts` **sempre** cria `status: 'confirmed'` — nenhum cenário produz recusa nem pedido pendente.
Não há simulação de timeout após a criação, nem retomada de pedido pendente após refresh/reconexão.

**Falta:**

- [ ] Cenário determinístico de pagamento recusado (e a UI de recusa, já existente, exercitada).
- [ ] Cenário de pedido pendente → confirmado/recusado via `order.updated`.
- [ ] Timeout após criação do pedido com recuperação pela chave de idempotência (§163).

### 7. Revalidação da cotação antes de confirmar (§72, §190)

**Evidência:** o checkout (`src/routes/checkout.tsx`) envia `POST /api/orders` e o mock recotiza a partir de
`readCart()` no servidor. A UI não reapresenta a cotação: se preço, cupom, taxa ou disponibilidade mudarem entre a
exibição e o clique, o pedido fecha com o valor novo **sem nova confirmação**.

**Falta:**

- [ ] Revalidar preço/disponibilidade/cupom/taxas antes de confirmar e exigir novo aceite quando algo mudou (§72).
- [ ] Bloquear a confirmação com cotação desatualizada (§190) — depende do item 1.

### 8. Cenários de rede e falha configuráveis no MSW (§6, §150–164)

**Evidência:** `src/mocks/handlers.ts` aplica `LATENCY_MS = 350` fixo; não há latência variável, respostas fora de
ordem, falha de conexão, 5xx, timeout ou seleção de cenário.

**Já coberto:** sessão expirada/401 (rotas de perfil), conflito de cadastro (409), validação (422), cupom
inválido/expirado (404/410), disponibilidade (409).

**Falta:**

- [ ] Mecanismo de seleção de cenário (env/query/localStorage) + reset integral (§148).
- [ ] Latência variável, respostas fora de ordem, offline, 4xx/5xx e timeout pós-criação de pedido (§152–164).
- [ ] Documentar como reproduzir cada cenário (§277).

### 9. Isolamento por usuário e limpeza no logout (§4, §82, §84, §98, §267)

**Evidência:**

- `src/mocks/handlers.ts` exige `Authorization` **apenas** em `/api/profile*` (`requireAccountId`). Carteiras, carrinho
  e pedidos respondem sem token.
- `wallet-store`, `cart-store` e `order-store` mantêm estado **global**, sem vínculo com a conta.
- As chaves do cache não incluem o usuário (`src/modules/profile/keys.ts`, `wallets/keys.ts`, `orders/keys.ts`).
- `logout()` (`src/modules/auth/auth-context.tsx`) limpa apenas a sessão local, **sem** `queryClient.clear()` e sem
  subscriptions — dados privados permanecem em cache após a troca de usuário.

**Falta:**

- [ ] Exigir `Authorization` também em carteiras e pedidos (§82) e vincular dados ao usuário (§98).
- [ ] Limpar cache privado e subscriptions no logout/troca de usuário (§84, §267).

### 10. Documentação da solução (§102, §212, §277, §279, §12)

**Evidência:** o `README.md` do repositório é o próprio enunciado; não há `ARCHITECTURE.md` nem seções de setup,
credenciais, cenários e comandos.

**Falta:**

- [ ] `ARCHITECTURE.md`: decisões de UX, desvios do Figma, limitações, política de cache/retries, estado do
      carrinho, política de sessão e reconciliação REST ↔ Socket.IO (§279, §102).
- [ ] `README.md` da solução: setup, variáveis de ambiente, credenciais fictícias, seleção/reset de cenários,
      comandos de execução e reprodução dos fluxos de falha (§277).
- [ ] Documentar os eventos Socket.IO e os contratos REST completos (§§5/7) e as substituições de assets:
      apenas 4 imagens para 36 NFTs (`public/assets/nft/`) e ícones `lucide-react` no menu da conta (§212).

### 11. Expiração de sessão durante a navegação e o checkout (§84, §159)

**Evidência:** só `/profile` trata o 401 (encerra a sessão e reabre o login, `src/routes/profile.tsx`).
`useRequireSession` (`src/modules/auth/use-require-session.ts`) decide apenas pela sessão local, e o checkout não
trata 401 de `/profile`, `/wallets` nem do POST de pedido.

**Falta:**

- [ ] Tratar expiração com preservação de contexto em qualquer fluxo privado, não só no perfil.

### 12. Transições de estado em segundo plano e atualizações ao vivo (§95, §177, §209)

**Evidência:** consultas/mutations têm carregamento, vazio, erro e sucesso; a "atualização em segundo plano"
existe só como `staleTime` de 30s. Não há atualização ao vivo (item 1) nem aviso acessível de alteração.

**Falta:**

- [ ] Refetch/refresh explícito com indicador de atualização e aviso acessível de mudanças de preço/disponibilidade.

---

## P2 — Verificações e ajustes finos

- [ ] **Login/Cadastro sem rota própria** (modal, §3/§100): confirmar se o Figma prevê frames de página; §100 pede
      acesso direto a todas as telas previstas.
- [ ] **Responsividade com evidência** em 390/768/1440 (§198), incluindo perfil, carteiras e confirmação em mobile
      (§46), e ausência de overflow horizontal/perda com zoom (§210).
- [ ] **Acessibilidade**: auditoria de contraste e de estados não dependentes só de cor (§208) e operação por
      teclado nas telas novas de checkout/carteiras (§204).
- [ ] **Comandos** (§281): falta `preview` explícito (hoje `start` = `srvx serve --prod`), `test:e2e` e `lighthouse`.
- [x] `src/lib/realtime.ts` não é mais código morto: é usado pelo item 1 (cliente Socket.IO carregado sob demanda após o MSW ativar os mocks).

---

## Em conformidade (verificado)

- **Stack** (§2): React + TypeScript + TanStack Router + TanStack Query + Axios + REST + Tailwind + shadcn/ui + MSW
  atuando de fato (falta Socket.IO, Playwright e Lighthouse — itens 1, 2 e 5).
- **Telas** (§3): início, detalhe, carrinho, pagamento, confirmação, perfil, carteiras e login/cadastro (em modal),
  com versões desktop e mobile.
- **Catálogo** (§52–55): busca/filtros/ordenação/paginação no estado da URL (`src/modules/catalog/search-params.ts`),
  filtros combináveis, paginação reiniciada, vazio/erro, detalhe com acesso direto, 404, edição indisponível e limite
  de quantidade (`src/modules/nft-detail`, `src/routes/nfts.$id.tsx`).
- **Carrinho** (§60–66): adicionar/alterar/remover com disponibilidade, cupom válido/inválido/expirado, resumo
  coerente, ETH como string decimal (`src/modules/cart/pricing.ts`), persistência em `localStorage` e atualização
  otimista com rollback (`src/modules/cart/mutations.ts`).
- **Pagamento e confirmação** (§70–78): validação com foco no primeiro campo, revisão, carteiras cadastradas com
  conexão/desconexão/troca, criação idempotente com conflito de chave, recibo com snapshot imutável e remoção apenas
  dos itens comprados (`src/mocks/order-store.ts`).
- **Conta e sessão** (§82–86): cadastro/login/logout, sessão recuperável após refresh (`localStorage`), senhas apenas
  como hash FNV-1a com sal, validação com erros da API por campo.
- **Integração e estado** (§90–102): contratos tipados com Zod, invalidação após mutations, cancelamento nas
  mutations do carrinho, chaves por parâmetros de consulta, rotas inexistentes.
- **Interface** (§194–200): skeletons com `shimmer` e `prefers-reduced-motion` (`src/styles/app.css`),
  `aria-describedby` nos campos (`src/components/common/field.tsx`), foco preso e ESC em diálogos
  (`src/components/common/dialog-behavior.ts`), feedback de mutation com `role="status"`/`role="alert"`.
- **Verificações atuais**: `npm run typecheck`, `npx eslint src scripts` e `npm run build` limpos;
  `npm run check:mocks` com 98 checks de contrato passando.

---

## Ordem sugerida de trabalho

1. **Tempo real (item 1)** — requisito eliminatório de stack e base para os itens 6, 7 e 12.
2. **Favoritos (item 3)** — fluxo de tela exigido e hoje ausente.
3. **Playwright (item 2)** — requisito eliminatório; depende dos cenários dos itens 1, 6 e 8 para cobrir §226–227.
4. **Isolamento por usuário + logout (item 9)** — risco eliminatório de vazamento entre contas.
5. **Deploy + documentação + Lighthouse (itens 4, 5 e 10)** — fecham a entrega (§12).
