# TASKS.md — sistemaVivox

Estados: BACKLOG → PLANEJAMENTO → PRONTA → EM DESENVOLVIMENTO → REVISÃO → CONCLUÍDA (+ BLOQUEADA)

## TASK-000 — Higienizar segredos versionados no Git
**Status**: CONCLUÍDA (parcial — ver pendência)
**Responsável**: Orquestrador
Removidos `.env` e `backend/google-credentials.json` do tracking, `.gitignore`
criado, senha hardcoded removida de `test-db.js`. Commit `09682db` já em
`kelson`. Push para `origin` bloqueado pelo GitHub (secret scanning) —
histórico antigo ainda contém a credencial. Detalhe completo: DECISIONS.md
(`hygiene-segredos`).
**Pendência que segue aberta**: TASK-001.

## TASK-001 — Rotacionar credenciais expostas [CRÍTICO]
**Status**: BLOQUEADA (só o humano pode executar — acesso a consoles externos)
**Escopo**: revogar/recriar a Service Account Google
(`vivox-sistema@vivox-sistema.iam.gserviceaccount.com`), trocar senha do
Postgres de produção, `JWT_SECRET` e chaves S3/MinIO em produção. Atualizar
`.env` de produção no Coolify com os novos valores.
**Por quê é crítico**: a credencial ficou pública em dois repos GitHub por
~2 dias antes da higienização (ver DECISIONS.md).

## TASK-002 — Adicionar guard de autenticação no IaController
**Status**: PRONTA
**Arquivos**: `backend/src/ia/ia.controller.ts`
**Escopo**: aplicar `@UseGuards(JwtAuthGuard)` em todas as rotas
(`/ia/pesquisar/:clienteId`, `/ia/mercado/:clienteId`,
`/ia/generate-mindmap/:clienteId`, `/ia/chat`). Hoje expõem dado de cliente
real (RAG) sem token.

## TASK-003 — Proteger endpoint seed-admin
**Status**: PRONTA
**Arquivos**: `backend/src/auth/auth.controller.ts`, `backend/src/users/users.service.ts`
**Escopo**: remover o fallback de credenciais default (`kelson@vivox.com.br`/`123456`)
quando o body vem vazio, ou proteger a rota (token de setup de um único uso via
env var, por exemplo). Hoje qualquer pessoa pode chamar `POST /auth/seed-admin`
sem autenticação e resetar a senha do admin.
**nao_fazer**: não remover a funcionalidade de provisionamento — ela existe
para viabilizar deploy no Coolify sem acesso a shell.

## TASK-004 — Restringir CORS
**Status**: PRONTA
**Arquivos**: `backend/src/main.ts`
**Escopo**: trocar `app.enableCors()` por uma allowlist de origins (frontend
de produção + localhost em dev).

## TASK-005 — Regularizar migrations Prisma
**Status**: PLANEJAMENTO (precisa investigar o schema real de produção antes de decidir a estratégia — risco de drift)
**Escopo**: gerar uma migration que reflita o `schema.prisma` atual (20
models), incorporar a criação do índice HNSW (`create_hnsw_index.ts`) numa
migration em vez de script manual. Cuidado: banco de produção pode já ter o
schema atual aplicado via `db push` — migration precisa ser gerada sem tentar
recriar o que já existe (`prisma migrate resolve`/baseline).

## TASK-006 — Resolver duplicação de vivox-tokens.css
**Status**: BACKLOG
**Escopo**: decidir uma fonte única (provavelmente `vivox-clientes/src/design-system/`)
e tratar a cópia da raiz como documentação/histórico, ou remover.

## TASK-007 — Diferenciar oportunidades mock vs persistidas no Analytics
**Status**: BACKLOG
**Arquivos**: `backend/src/analytics/analytics.service.ts`
**Escopo**: `getResultados()` gera oportunidades mock (`id: 'mock-N'`) quando
não há `Oportunidade` persistida. Adicionar flag explícita (`origem: 'calculada' | 'persistida'`)
para o frontend não tratar sugestão como dado real.

## TASK-008 — Decidir sobre Redis/BullMQ
**Status**: BACKLOG (decisão arquitetural — Orquestrador + humano)
**Escopo**: Redis está provisionado (Docker, `.env`) e documentado no README
como fila (BullMQ), mas não há nenhum uso real no código — cache é em memória
local. Decidir: (a) implementar de fato a fila de eventos entre módulos
conforme `VIVOX_backend_arquitetura.md`, ou (b) remover a promessa de fila do
README/infra até haver necessidade real. Não deixar a divergência documentada
vs. real como está.

## TASK-009 — Corrigir geração de URL pública do StorageService para produção
**Status**: BACKLOG
**Arquivos**: `backend/src/storage/storage.service.ts`
**Escopo**: hoje troca a string `minio`→`localhost` no endpoint — hack válido
só em dev local. Confirmar como funciona em produção (endpoint real de S3/R2)
e tornar a geração de URL explícita por ambiente, não por substituição de string.

## TASK-010 — Mover scripts de debug para fora da árvore compilável
**Status**: BACKLOG
**Arquivos**: `backend/test-*.js`, `backend/test_auth.ts`, `backend/clear.ts`,
`backend/update-client-google.js`, `backend/create_hnsw_index.ts`
**Escopo**: mover para `backend/scripts/` (fora de `src/`), garantir que nenhum
tenha credencial hardcoded (ver TASK-000), e que `clear.ts` (apaga todos os
planejamentos sem confirmação) tenha alguma proteção contra execução acidental.

## TASK-011 — Remover dependência morta `cron`
**Status**: BACKLOG (trivial)
**Arquivos**: `backend/package.json`
**Escopo**: `cron` (`^4.4.0`) não é importado em lugar nenhum; só
`@nestjs/schedule` é usado.

## TASK-012 — Remover código morto UsersService.setup()
**Status**: BACKLOG (trivial)
**Arquivos**: `backend/src/users/users.service.ts`
**Escopo**: método existe mas não é exposto por nenhuma rota; redundante com
`seedAdmin`.

## TASK-013 — Padronizar logging
**Status**: BACKLOG
**Escopo**: substituir `console.log`/`console.error` por `Logger` do Nest em
`auth.controller.ts`, `clientes.controller.ts`, `main.ts`.

## TASK-014 — Reescrever histórico do Git para remover segredos definitivamente
**Status**: BLOQUEADA (aguardando decisão do usuário — destrutivo, exige force-push)
**Escopo**: `git filter-repo`/BFG para apagar `.env` e `google-credentials.json`
de todos os commits, force-push em `kelson` e `origin`. Só executar após
TASK-001 (credenciais já rotacionadas) — reescrever histórico sem rotacionar
não resolve a exposição já ocorrida.
