# CONTEXT.md — sistemaVivox

> Validado contra o código em 2026-08-18. Atualize esta data ao revalidar.

## O que é

Sistema web interno da agência **VIVOX** (não é planilha). Centraliza clientes,
serviços contratados, produções, hospedagem, analytics e um assistente de IA
("segundo cérebro") por cliente.

Repos: `github.com/kelson-cosme/sistemaVivox` (remote `kelson`) e
`github.com/VIVOX-Workstation/sistemaVivox` (remote `origin`).

## Stack real (não a planejada — validada no código)

- **Backend**: NestJS 11 + TypeScript, Prisma 5 + PostgreSQL (imagem `pgvector/pgvector:pg16`).
- **Auth**: JWT (`passport-jwt` + `bcrypt`), guard por controller (não há guard global).
- **IA**: Groq (`llama-3.3-70b-versatile`) via Vercel AI SDK para chat/geração; embeddings via OpenAI (`text-embedding-3-small`) + pgvector para RAG; Tavily para pesquisa de mercado.
- **Analytics real**: Google Analytics 4 Data API + Google Search Console API, via Service Account. **Não há integração com Instagram/Meta Graph API** — dados do Instagram no frontend vêm de importação manual ou da ferramenta terceira "Reportei" (campo `origemDado`).
- **Storage**: `@aws-sdk/client-s3` apontando para MinIO em dev (S3/R2 compatível).
- **Redis**: subido no Docker mas **não é usado no código** — não há BullMQ nem qualquer client Redis em `src/`. Cache é feito em memória local (`Map`, TTL). Ver [[decisao-redis-nao-usado]].
- **Frontend**: Vite + React 19 + TS, Tailwind v4, `react-router-dom` v7, React Flow (fluxogramas de planejamento), Tiptap (editor), sem estado global (Redux/Zustand) — Context API + local state.
- **Deploy**: Docker, produção no Coolify.

## Como rodar (dev local)

```bash
cp .env.example .env
docker compose up -d
docker compose logs -f backend
```
Serviços: API em `localhost:3000`, MinIO console em `localhost:9001` (vivox/vivox12345), Postgres em `localhost:5432` (vivox/vivox/vivox).

## Módulos existentes (backend/src)

`auth`, `users`, `clientes`, `servicos`, `producoes`, `midias`, `hospedagem`,
`planejamento-servico`, `analytics` (+ `analytics/google`), `ia`, `storage`.

Módulos **planejados mas não implementados** (aparecem no menu do frontend como
"Em Breve"): Revisão, Educacional, Analista, Studio, Film, GP (Bitrix).

## Estado atual (2026-08-18)

- Módulos maduros/funcionais: `hospedagem` (radar de renovação), `planejamento-servico`
  (fluxograma, Gantt, Kanban, auditoria — o mais robusto, único com testes),
  `clientes`, `analytics` (Google real; Instagram é dado manual/Reportei).
- Frontend tem tela para praticamente todo módulo backend existente.
- **Débito de segurança crítico tratado em 2026-08-18** (commit `09682db`): `.env`
  e `backend/google-credentials.json` estavam versionados com segredos reais
  (Service Account do Google, JWT_SECRET, chaves S3). Removidos do HEAD e do
  `.gitignore` da raiz (que não existia). **A credencial Google e a senha do
  Postgres de produção ainda precisam ser rotacionadas manualmente** — não
  foram removidas do histórico do Git (push de história reescrita não foi
  autorizado). Ver [[decisao-hygiene-segredos]] e TASK-001 em TASKS.md.
- Endpoints sem autenticação identificados: `POST /auth/seed-admin` (cria/reseta
  senha de admin com default fraco) e todo o `IaController`. Ver TASKS.md.

## Onde estão as coisas

- Planejamento original (histórico, não 100% fiel ao código atual): `VIVOX_backend_arquitetura.md`,
  `VIVOX_CLIENTES_planejamento.md`, `VIVOX_ANALYTICS_planejamento.md` (raiz do repo).
- Design system: `VIVOX_DESIGN_SYSTEM.md` + `vivox-tokens.css` (raiz **e** duplicado em
  `vivox-clientes/src/design-system/` — ver débito em TASKS.md).
- Setup de integração Google: `GOOGLE_INTEGRATION_SETUP.md`.
