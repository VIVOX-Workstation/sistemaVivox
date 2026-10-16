# AGENTS.md — como trabalhar no Sistema VIVOX

Vale para qualquer pessoa ou IA (Claude Code, Codex, Cursor, Copilot) que for
ler ou mudar este repositório.

## 1. Leia antes de começar

1. [`docs/MEMORIA_DO_SISTEMA.md`](docs/MEMORIA_DO_SISTEMA.md): como o sistema funciona hoje, permissões, onde mora cada dado, armadilhas e o que mudou.
2. [`docs/CRUZAMENTO_TELAS_DADOS.md`](docs/CRUZAMENTO_TELAS_DADOS.md): cada tela, o que ela mostra e o que já existe no backend.
3. [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): visual, componentes e o fluxo interface → Artifacts → git.
4. Para o VVOX Sync (`vivox-clientes/public/kanban/`): [`DESIGN.md`](DESIGN.md) e [`VVOX_SYNC.md`](VVOX_SYNC.md).

`docs/CONTEXT.md`, `docs/ARCHITECTURE.md` e `docs/TASKS.md` são de 2026-08-18 e
estão desatualizados; servem como histórico.

## 2. Regras para não inventar

- **O código é a verdade.** Antes de afirmar que algo existe, abra o arquivo. Se a memória estiver errada, corrija-a no mesmo PR.
- **Não crie dado que o backend não tem.** Todo campo de tela precisa de endpoint + campo no Prisma + campo no DTO (o `ValidationPipe` descarta campo não declarado sem avisar). Se faltar, diga "precisa de backend" e pare.
- **Não crie rota, tela, módulo ou permissão que não foram pedidos.**
- **Não confunda os dois quadros de tarefas.** VVOX Sync (`quadroId`/`colunaId`, iframe) e GP legado (`status`/`projetoId`, React) usam a mesma tabela `Tarefa`.
- **Não guarde dado de negócio no `localStorage`.**
- **Não reescreva o VVOX Sync em React** nem aplique `DESIGN.md` a outras telas.
- Quando não souber, pergunte. Quando supuser algo, diga que é suposição.

## 3. Fluxo de uma mudança

1. **Entender:** rota em `vivox-clientes/src/App.tsx`, página, componentes, `api/`, controller e service no `backend/src/<modulo>/`, model no `schema.prisma`.
2. **Planejar:** liste o que muda, o que não existe no backend e quem pode ver (papel + módulo).
3. **Tela nova ou redesenho:** protótipo no canvas do Artifacts antes do código (passo a passo em `docs/DESIGN_SYSTEM.md › 1`).
4. **Implementar** numa branch `<tipo>/<descricao>` (`feat/`, `fix/`, `style/`, `refactor/`, `docs/`, `chore/`). Nunca direto na `main`.
5. **Validar:** `npm run build` e `npm run lint` em `vivox-clientes`; `npm test` em `backend` quando mexer na API; teste no navegador como ADMIN, COLABORADOR com módulos limitados e CLIENTE quando for portal.
6. **Registrar:** uma linha em `docs/MEMORIA_DO_SISTEMA.md › Registro de mudanças` e atualização das seções afetadas.
7. **PR:** skill `.claude/skills/create-pr`. Push e PR só com confirmação de quem pediu.

## 4. Segurança

- Rota nova no backend: `@UseGuards(JwtAuthGuard)` + `@RequerModulo({ todos: [...] })` ou `@Roles(...)`. Não há guard global.
- Nunca devolva `senha`, tokens da Meta ou `openpanelClientSecret` em respostas.
- Nunca commite `.env`, `*credentials*.json` ou chaves.

## 5. Agents do projeto

`.claude/agents/` tem agentes por área (`frontend-ui`, `backend-domain`,
`db-migration`, `ia-engine`, `integrations-infra`, `git-github-workflow`). Eles
seguem estas mesmas regras.
