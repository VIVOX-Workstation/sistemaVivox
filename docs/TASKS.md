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
**Status**: REVISÃO (implementado na branch `fix/seguranca-ia-seedadmin-cors`, commit `c5eef61`, aguardando merge)
**Arquivos**: `backend/src/ia/ia.controller.ts`
`@UseGuards(JwtAuthGuard)` aplicado no nível do controller, cobrindo todas as rotas.

## TASK-003 — Proteger endpoint seed-admin
**Status**: REVISÃO (implementado na branch `fix/seguranca-ia-seedadmin-cors`, commit `c5eef61`, aguardando merge)
**Arquivos**: `backend/src/auth/auth.controller.ts`
Endpoint agora exige `setupToken` no body, comparado a `SETUP_TOKEN` (env var,
sem default). Sem essa env var definida, o endpoint recusa qualquer chamada.
Defaults fracos de email/senha removidos — ambos passam a ser obrigatórios.
**Pendência operacional**: `SETUP_TOKEN` precisa ser definido manualmente em
`backend/.env` local e no ambiente de produção (Coolify) — não é versionado.

## TASK-004 — Restringir CORS
**Status**: REVISÃO (implementado na branch `fix/seguranca-ia-seedadmin-cors`, commit `c5eef61`, aguardando merge)
**Arquivos**: `backend/src/main.ts`
`app.enableCors()` trocado por allowlist via `CORS_ORIGINS` (env var, CSV),
fallback `http://localhost:5173` (porta padrão do Vite) se não definida.
**Pendência operacional**: `CORS_ORIGINS` precisa incluir a origem real do
frontend de produção no ambiente do Coolify, senão requests cross-origin em
produção serão bloqueados.

## TASK-005 — Regularizar migrations Prisma
**Status**: REVISÃO (migration gerada e commitada em `1ca73de`, ainda NÃO aplicada em nenhum ambiente)
**Escopo**: migration `20260818154500_regulariza_schema_e_vetores` cobre os 9
models que faltavam, extensão pgvector e índice HNSW.
**Pendência crítica**: falta rodar `prisma migrate deploy` — isso precisa de
aprovação explícita do Orquestrador/humano antes de executar contra o banco
de produção (risco de conflito se o schema já tiver sido aplicado via
`db push`). Rodar primeiro em ambiente de dev/staging para validar.

## TASK-006 — Resolver duplicação de vivox-tokens.css
**Status**: BACKLOG
**Escopo**: decidir uma fonte única (provavelmente `vivox-clientes/src/design-system/`)
e tratar a cópia da raiz como documentação/histórico, ou remover.

## TASK-007 — Diferenciar oportunidades mock vs persistidas no Analytics
**Status**: REVISÃO (implementado, commit `1ca73de`)
**Arquivos**: `backend/src/analytics/analytics.service.ts`, `vivox-clientes/src/types/index.ts`, `vivox-clientes/src/components/ClientTabs/AnalyticsTab.tsx`
`getResultados()` agora marca cada oportunidade com `origem: 'persistida' | 'calculada'`;
frontend exibe a distinção visualmente (badge verde/azul).

## TASK-008 — Decidir sobre Redis/BullMQ
**Status**: BACKLOG (decisão arquitetural — Orquestrador + humano)
**Escopo**: Redis está provisionado (Docker, `.env`) e documentado no README
como fila (BullMQ), mas não há nenhum uso real no código — cache é em memória
local. Decidir: (a) implementar de fato a fila de eventos entre módulos
conforme `VIVOX_backend_arquitetura.md`, ou (b) remover a promessa de fila do
README/infra até haver necessidade real. Não deixar a divergência documentada
vs. real como está.

## TASK-009 — Corrigir geração de URL pública do StorageService para produção
**Status**: REVISÃO (implementado, commit `1ca73de`)
**Arquivos**: `backend/src/storage/storage.service.ts`, `.env.example`
Agora aceita `S3_PUBLIC_URL` explícito (usado se definido); fallback
`minio`→`localhost` só roda se `NODE_ENV !== 'production'`.
**Pendência operacional**: definir `S3_PUBLIC_URL` no ambiente de produção
(Coolify) apontando para a URL pública real do bucket/CDN.

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
