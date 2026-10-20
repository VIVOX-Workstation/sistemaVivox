# Serviços e Planejamento

## Para que serve

Para cada serviço contratado, planejar as entregas (briefing, roteiro, etapas de
produção, publicação) e, nos serviços de app, acompanhar o desenvolvimento no DevBoard.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/cliente/:id/servicos/:sid/planejamento[/:itemId]`, `/cliente/:id/servicos/:sid/devboard` |
| Telas | `pages/PlanejamentoServico.tsx` (+ `planning-workspace.css`), `pages/DevBoard.tsx` |
| Backend | `backend/src/planejamento-servico/`, `backend/src/devboard/`, `backend/src/github/`, `backend/src/servicos/` |

## Dados

- `PlanejamentoServico.flowNodes` (JSON): cada item é um `ItemPlanejado` com título, status, prazo, público, oferta, referências, `estrutura[]`, `etapas[]`, `tarefaIds[]`, `linkFinal`.
- `DevBoardCard` ligado ao serviço e ao repositório do GitHub App.
- Endpoints `/planejamento-servico/servico/:sid`, `/servicos/:sid`, `/devboard/*`.

## Quem acessa

Módulo **CLIENTES**.

## Como funciona

- Salvamento automático com fila; há cópia de reserva no `localStorage`.
- Serviço do tipo `APP` abre o DevBoard em vez do Planejamento.
- "Nova issue" no DevBoard cria card, não issue no GitHub.

## Conversa com

- **Demandas gerais:** item pode criar tarefa e guarda os ids (`tarefaIds`).
- **Hospedagens:** item de landing page aponta para um `AtivoHospedagem`.
- **Chamados:** chamado pode apontar para o item (`itemPlanejadoId`).
- **Assistente IA:** ideias no planejamento usam `/ia/chat`.

## Pendências e cuidados

- `Chamado.itemPlanejadoId` e `AtivoHospedagem.itemPlanejadoId` apontam para um id dentro do JSON, não para uma tabela.
- O conteúdo das abas do item ainda está no visual antigo; DevBoard não migrado para o visual clean.

## Registro de mudanças

- 2026-10-19 · `feat/demandas-gerais` · Texto da lista aponta para Demandas gerais · `PlanejamentoServico.tsx` · —
- 2026-10-16 · `style/telas-clean` · Visual clean da lista e do cabeçalho do item · `PlanejamentoServico.tsx` · abas internas no visual antigo.
- 2026-09-15 · — · DevBoard com GitHub App · `backend/src/devboard`, `github` · —
- 2026-08-05 · — · Planejamento com fluxograma e Gantt · — · —
