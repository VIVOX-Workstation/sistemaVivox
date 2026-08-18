# CONVENTIONS.md — sistemaVivox

## Backend (NestJS)

- Um módulo por domínio em `backend/src/<dominio>/`, gerado via Nest CLI
  (`module` + `controller` + `service` + `dto`). Siga o padrão dos módulos
  maduros (`hospedagem`, `planejamento-servico`) como referência, não os
  simples/esqueleto.
- Prisma Client é a fonte de tipos — não preencher `entities/*.entity.ts`
  (hoje são stubs vazios não usados; não reative esse padrão).
- Toda rota que expõe dado de cliente real precisa de
  `@UseGuards(JwtAuthGuard)`. Antes de criar um controller novo, confirmar que
  o guard foi aplicado — dois módulos existentes (`auth/seed-admin`, `ia`)
  ficaram sem guard por descuido, não repita.
- Logging: usar o `Logger` do Nest, não `console.log`/`console.error` (há
  inconsistência hoje em `auth.controller.ts`, `clientes.controller.ts`,
  `main.ts` — não é padrão a seguir, é débito a corrigir quando tocar nesses
  arquivos).
- Scripts de debug/seed manuais (`test-*.js`, `clear.ts`, `update-*.js`) não
  devem conter credenciais hardcoded — usar `DATABASE_URL`/env do
  `PrismaClient()` padrão. Idealmente movê-los para fora da árvore compilável
  do Nest (`backend/scripts/` em vez da raiz de `backend/` ou dentro de `src/`).

## Prisma / banco

- Toda alteração de schema deve gerar uma migration real
  (`prisma migrate dev`), não `db push` direto em produção — o schema atual já
  tem drift por causa disso (só 1 migration para 20 models). Ver TASK-005.
- Índices que não são expressáveis no schema Prisma (ex: HNSW em pgvector)
  devem ficar documentados e, se possível, incorporados a uma migration SQL
  manual (`prisma migrate dev --create-only` + editar o SQL), não como script
  solto rodado manualmente.

## Frontend (vivox-clientes)

- Sem estado global (Redux/Zustand) — Context API (`AuthContext`) + estado
  local. Manter essa escolha a menos que surja necessidade real de estado
  compartilhado complexo entre telas distantes.
- Design tokens em `vivox-tokens.css` — **existe duplicado** na raiz do repo e
  em `vivox-clientes/src/design-system/`. Até resolver a duplicação (TASK-006),
  editar sempre os dois ou tratar o da raiz como cópia de referência apenas.
- Paleta/identidade: dourado (`#C7A15F`) como cor de ação/seleção, superfícies
  quentes (não cinza neutro), pouca sombra — ver `VIVOX_DESIGN_SYSTEM.md` para
  o sistema completo antes de criar componente novo.
- API client centralizado em `api/client.ts` (axios, interceptor injeta
  `Authorization: Bearer`, redireciona para `/login` em 401). Não duplicar essa
  lógica em chamadas soltas.

## Git

- Nunca commitar `.env`, `*credentials*.json` ou qualquer segredo — o
  `.gitignore` da raiz cobre isso desde 2026-08-18 (ver DECISIONS.md). Se
  precisar de credencial real para um script de teste manual, usar variável de
  ambiente, nunca literal no código.
- Branch por tarefa (`feat/`, `fix/`, `style/`, `refactor/`), nunca commitar
  direto na `main` salvo correções emergenciais coordenadas com o humano (como
  o fix de segredos de 2026-08-18, que foi uma exceção justificada).
