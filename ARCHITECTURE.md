# ARCHITECTURE.md — Kurio NFT Marketplace

Decisões de arquitetura, desvios do enunciado (`README.md`) e limitações conhecidas da solução.

## Stack

- **React + TypeScript + TanStack Router + TanStack Query + Axios + Tailwind CSS v4 + shadcn/ui**
- **MSW** (Mock Service Worker) simula 100% da API REST em desenvolvimento, demonstração e testes — não há backend real.
- **Socket.IO** (`socket.io-client@4.8.4`) para tempo real, com o transporte interceptado pelo MSW via [`@mswjs/socket.io-binding@0.2.0`](https://github.com/mswjs/socket.io-binding).
- **Playwright@1.64.1** com Chromium em cache (sem downloads) para testes E2E em projetos `desktop` e `mobile`.

## Mocks (camada de rede)

`src/router.tsx` inicia o worker do MSW (`enableMocks()`) antes de criar o roteador, então **todas** as requisições da aplicação passam pelos mocks em `src/mocks/handlers.ts`. Os mocks reutilizam contratos (Zod) e cenários entre dev, demonstração e testes E2E.

### `.npmrc`

O binding `@mswjs/socket.io-binding@0.2.0` declara peer `msw@^2.10.2`, mas o projeto usa `msw@3.0.3`. O `.npmrc` define `legacy-peer-deps=true` para permitir a instalação. Documentado aqui porque o binding não funcionaria sem ele.

### Tempo real (Socket.IO simulado)

O MSW intercepta apenas o transporte **WebSocket**; por isso o cliente é montado com `transports: ['websocket']` e o token de sessão viaja na query do handshake (`?token=<userId>`).

**Contrato dos eventos** (`src/modules/realtime/messages.ts`): `nft.updated` e `order.updated`, cada um com `event`, `resource`, `id`, `version` (monotônica), `emittedAt`, `ownerId` (eventos privados) e `payload` (recurso no mesmo formato da REST).

**Limitações do ambiente simulado** (entrega "melhor esforço"):

- não há namespaces, salas, reconexão com sessão retomada nem acknowledgements;
- o upgrade a partir de `polling` não é interceptado;
- eventos emitidos sem cliente conectado são perdidos — o cliente reconcilia com a REST ao reconectar (`reconcileLiveQueries`).

### Por que o cliente Socket.IO é importado sob demanda

O `engine.io-client` captura `const WebSocketCtor = globalThis.WebSocket` **no topo do módulo** (`src/lib/realtime.ts` explica). Se a importação acontecer antes do MSW aplicar o patch no `WebSocket` global, o app fala com o servidor de verdade. Por isso `createRealtimeClient` em `src/lib/realtime.ts` faz um `import('socket.io-client')` dinâmico, disparado pelo efeito de `RealtimeSync` — que só roda depois de os mocks estarem ativos.

### Variáveis de ambiente dos mocks

| Variável | Significado | Padrão |
|---|---|---|
| `VITE_ENABLE_MOCKS` | Ativa os mocks no cliente (`src/router.tsx`) | `true` via `.env` |
| `VITE_API_BASE_URL` | Base da API REST | `http://localhost:3000/api` via `.env` |
| `VITE_SOCKET_URL` | Base do Socket.IO (mesma origem do handler MSW) | `http://localhost:3000` via `.env` |
| `VITE_MOCK_SCENARIO` | Cenários ligados, separados por vírgula (`nft-price-change`, `nft-sold-out`, `order-pending`, `order-refused`, `order-timeout`) | nenhum (servidor estável) |
| `VITE_MOCK_SCENARIO_DELAY_MS` | Atraso entre conexão/criação de pedido e a mudança simulada | `1500` ms |

No **build de produção** (`netlify.toml`), defina `VITE_ENABLE_MOCKS=true` (e `VITE_API_BASE_URL=/api`) — sem isso a versão publicada fica sem dados, porque toda a API é simulada.

### Atenção com `import.meta.env` fora do bundler

O Vite injeta o objeto `import.meta.env` nos módulos que mencionam a expressão **literalmente**; no Node (scripts com `tsx`) a propriedade não existe. Por isso:

- leituras diretas como `import.meta.env.VITE_X` são evitadas — usa-se `import.meta.env as Record<...> \| undefined` com `?.` (`src/mocks/socket.ts`, `src/lib/api.ts`);
- os scripts `scripts/check-mocks.ts` e `scripts/check-realtime.ts` rodam em Node contra os mesmos handlers do MSW (`msw/node`).

### Reset de estado (`POST /__mock-reset`)

O servidor de desenvolvimento é compartilhado pelos testes E2E de um mesmo projeto. O handler `*/__mock-reset` (apenas em desenvolvimento) restaura carrinho, catálogo, pedidos, carteiras e estado dos cenários — usado em `test.beforeEach` para isolar casos (ex.: um preço alterado no teste A não vazar no teste B).

## Fluxos de sessão

- `useRequireSession(fallbackTo)` guarda a intenção de retomada em `sessionStorage` (`rememberAfterLogin`) e abre o diálogo de login; ao entrar, `AuthProvider` devolve o usuário ao destino interrompido.
- A saída (logout) é decidida pela sessão local (`authenticatedRef`) para não reabrir o diálogo de login quando o usuário sai da própria tela privada.
- Trava `notifiedRef`: a navegação para a rota de fallback acontece uma única vez por visita — sem ela, o efeito reexecutava e sobrescrevia a intenção de retomada (`/checkout` viraria `/cart`).

## Pedidos, cotação e idempotência

- `POST /api/orders` aceita `Idempotency-Key`: repetir a chave recupera o mesmo pedido (sem compra dupla); reutilizar com conteúdo diferente gera `IDEMPOTENCY_CONFLICT` (409).
- `If-Match` carrega o `etag` da cotação exibida; se o carrinho mudou (preço, disponibilidade, cupom), a API responde `QUOTE_CHANGED` (409) e o usuário revisa o novo total (§72, §190).
- Cenário `order-timeout`: o servidor cria o pedido, mas descarta a primeira resposta HTTP. O cliente repete com a mesma chave e recupera o pedido existente (§163, §192).

## Limitações conhecidas

- **SSR**: os mocks rodam apenas no navegador, então o HTML do servidor para `/cart`, `/checkout`, `/orders/*` e partes de `/profile`, `/wallets` contém só skeletons — verificar no navegador, não com `curl`.
- **Isolamento por usuário** (P1): carrinho, carteiras e pedidos ainda são globais (sem vínculo com a conta nem `queryClient.clear()` no logout) — item aberto no `todo.md`.
- **Entrega de tempo real "melhor esforço"**: eventos perdidos durante quedas são reconciliados por REST na reconexão.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) com mocks |
| `npm run build` | Build de produção + typecheck |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run check:mocks` | 98 checks de contrato REST (`tsx scripts/check-mocks.ts`) |
| `npm run check:realtime` | Aplicador puro + QUOTE_CHANGED/idempotência (`tsx scripts/check-realtime.ts`) |
| `npm run test:e2e` | Playwright: suíte de tempo real (cenários padrão) + suíte de timeout/recuperação (`order-refused,order-timeout`), desktop e mobile |
| `npm run start` | `srvx serve --prod` do build |

## Testes E2E

- `e2e/realtime.spec.ts`: preço ao vivo no carrinho com aviso acessível (`role="status"`); pedido pendente → recusado pelo `order.updated`; login retoma o checkout.
- `e2e/order-timeout.spec.ts` (rodar com `npm run test:e2e`, que define `VITE_MOCK_SCENARIO=order-refused,order-timeout`): resposta perdida na criação + recuperação idempotente sem compra dupla.
- Relatórios: `playwright-report/` (HTML) e `test-results/` (traces em falha) — ambos no `.gitignore`.
