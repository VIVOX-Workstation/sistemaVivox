# Minhas tarefas

## Para que serve

Mostra a cada pessoa as tarefas em que ela é responsável, agrupadas por prazo.
Também abriga as telas legadas do antigo **Vivox GP** (workspaces com Kanban,
Lista e Prazos).

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/gp/minhas-tarefas[/tarefa/:id]`, `/gp/workspace/:id[/tarefa/:id]`, `/gp?clienteId=&servicoId=` (lista de um cliente/serviço) |
| Página | `vivox-clientes/src/pages/VivoxGP.tsx`; visão nova em `components/clean/MinhasTarefasView.tsx` |
| Janela da tarefa (legado) | `components/gp/TaskModal.tsx`, `TaskFormModal.tsx` |
| Backend | `backend/src/tarefas/` (`/tarefas`, `/projetos`) |

## Dados

`Tarefa` (filtrada por `responsavelId`), `Projeto` (workspace), `TarefaChecklist`,
`TarefaComentario`. Endpoints `/tarefas`, `/tarefas/:id`, `/projetos`,
importar Bitrix/backup, exportar.

## Quem acessa

Módulo **GP**. As ações passam pelo mesmo `KanbanService` de Demandas gerais,
então a matriz de permissões da função também vale aqui.

## Como funciona

- Usa `status` (texto: `A_FAZER`, `EM_ANDAMENTO`, `EM_REVISAO`, `CONCLUIDA`…) e `projetoId`; Demandas gerais usa `quadroId`/`colunaId`. Mudar o status aqui move a tarefa para a coluna equivalente.
- As colunas do Kanban legado ficam no `localStorage` de cada navegador.
- Só ADMIN altera prazo.

## Conversa com

- **Demandas gerais:** mesma tarefa, duas janelas diferentes (a daqui não tem cronômetro, entrega/aprovação, áudio, links).
- **Dashboard:** "Abrir tarefas" e indicadores levam para cá.
- **Chamados:** a tarefa criada pelo chamado aparece aqui para o responsável.

## Pendências e cuidados

- **Plano (etapa 4 do cérebro):** virar lista pessoal (atrasadas / esta semana / depois) que abre a tarefa em Demandas gerais, aposentando a janela legada.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean da lista de Minhas tarefas (`MinhasTarefasView`) · `VivoxGP.tsx` · modais legados mantidos.
- 2026-10-11 · — · Aba Projetos removida do GP; `/gp/projetos` redireciona · `App.tsx` · —
- 2026-09-14 · — · Observadores, Kanban otimizado, backup/importação por workspace · `components/gp/*` · —
- 2026-08-22 · — · Vivox GP: workspaces, Kanban estilo Bitrix24, chat com anexos · `VivoxGP.tsx` · —
