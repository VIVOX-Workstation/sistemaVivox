# DECISIONS.md — sistemaVivox

> Append-only. Cada entrada: decisão + data + motivo. Não editar entradas antigas — se uma decisão for revertida, registrar uma nova entrada linkando à anterior.

## 2026-08-04 — Monólito modular, não microsserviços

**Decisão**: NestJS + PostgreSQL + Prisma + Redis + fila de eventos (BullMQ) +
S3/R2, monólito modular com módulos desacoplados por domínio.
**Motivo**: sistema vai crescer para vários módulos (Clientes, Analytics,
Revisão, Educacional, Roteirista, Studio, Film, GP) compartilhando base;
microsserviços desde o início trariam complexidade operacional desnecessária
nesta fase. Módulo que crescer muito pode ser extraído depois se a
comunicação já for por eventos.
**Status real (2026-08-18)**: a parte de fila de eventos/BullMQ **não foi
implementada** — módulos se comunicam por chamada direta de service. Redis
está no Docker mas sem uso. Ver [[divergencia-fila-eventos]] em
ARCHITECTURE.md. Decisão de stack (Nest/Postgres/Prisma/S3) segue válida e
implementada; a parte de mensageria assíncrona precisa ser retomada
conscientemente ou formalmente descartada — não deixar como débito silencioso.

## 2026-08-18 — Higienização de segredos versionados no Git (id: hygiene-segredos)

**Contexto**: análise do Orquestrador encontrou `.env` (raiz) e
`backend/google-credentials.json` versionados no Git com segredos reais
(Service Account do Google Cloud, `JWT_SECRET`, chaves S3/MinIO), commitados em
`127d3b9` (2026-08-16) e já enviados a dois remotos GitHub
(`kelson-cosme/sistemaVivox` e `VIVOX-Workstation/sistemaVivox`).
`backend/test-db.js` também tinha a senha do Postgres de produção hardcoded.

**Decisão tomada** (aprovada pelo usuário, ver conversa de 2026-08-18):
1. Criado `.gitignore` na raiz (`.env`, `*credentials*.json`).
2. `.env` e `backend/google-credentials.json` removidos do tracking via
   `git rm --cached` (arquivos continuam no disco local).
3. Senha hardcoded removida de `test-db.js` (agora lê `DATABASE_URL` do
   ambiente).
4. Commit `09682db` — push feito com sucesso para `kelson`.
5. Push para `origin` **bloqueado pelo GitHub Push Protection**
   (secret scanning detectou a credencial Google ainda presente no histórico,
   commit `127d3b9`). Usuário optou por **não** reescrever o histórico neste
   momento — `origin` ficou 1 commit atrás, pendente.

**O que NÃO foi feito, e por quê**: não se reescreveu o histórico do Git
(`git filter-repo`/BFG + force-push) — é destrutivo (reescreve hashes de todos
os commits derivados) e o usuário optou por adiar essa decisão. Enquanto isso
não acontecer, a credencial antiga **continua recuperável no histórico de
ambos os remotos**.

**Ação pendente que só o humano pode fazer** (registrada como TASK-001):
rotacionar a Service Account do Google (`vivox-sistema@vivox-sistema.iam.gserviceaccount.com`),
trocar a senha do Postgres de produção, `JWT_SECRET` e chaves S3/MinIO em
produção. Rotação de credencial é a mitigação real — limpar o Git é higiene,
não suficiente sozinha, porque a chave já esteve pública por ~2 dias.
