# Demandas gerais

## Para que serve

É onde a equipe produz. Kanban com quadros e colunas: a demanda entra, é
executada com cronômetro, entregue para revisão e aprovada. Tem calendário de
publicações por cliente, atividade da equipe, bate-papo com áudio, anexos,
links de referência e permissões por função.

Antes se chamava **VVOX Sync**. Nasceu do Artifact "Quadro de Demandas VIVOX".

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/demandasgerais`, `/demandasgerais/:quadro`, `/demandasgerais/:quadro/tarefa/:id`. `/vvoxsync/...`, `/gp` e `/gp/tarefa/:id` redirecionam |
| Página React (só a moldura) | `vivox-clientes/src/features/kanban/` (`KanbanPage.tsx`, `hooks/useKanbanFrame.ts`) |
| Kanban (HTML/JS, sem React) | `vivox-clientes/public/kanban/` — `js/app.js` (interface), `js/backend.js` (API), `js/task-extras.js` (anexos, áudio, links), `css/app.css` (cópia byte a byte do original) |
| Backend | `backend/src/kanban/` (`kanban.service.ts`, `kanban.policy.ts`, `kanban-equipe.*`), rotas de tarefa em `backend/src/tarefas/` |
| Detalhes técnicos | [`VVOX_SYNC.md`](../../VVOX_SYNC.md), [`DESIGN.md`](../../DESIGN.md) |

## Dados

- `KanbanQuadro`, `KanbanColuna` (`papel`: queue, doing, review, done; `planoPublicacao`: todo/sched)
- `Tarefa` (`quadroId`, `colunaId`, `numero`, `versao`, `clienteNome`, `fonte`, `subtitulo`, `linksReferencia`), `TarefaChecklist`, `TarefaComentario` (chat, anexos, áudio), `TarefaSessao` (cronômetro)
- `User.cargo`, `User.funcaoKanban`, `User.fotoUrl`; `KanbanConfig` (matriz de permissões, cargos extras, dias de postagem por cliente)
- Endpoints: `/kanban/quadros`, `/kanban/colunas/:id`, `/kanban/tarefas/:id/{iniciar,pausar,entregar,aprovar,corrigir,mover}`, `/kanban/equipe*`, `/kanban/clientes/:id/logo`, `/tarefas/*`

## Quem acessa

Módulo **GP**. Dentro dele, duas camadas que o servidor aplica:

1. **Papel na tarefa:** autor (proprietário), revisor (supervisor), responsável, observadores (`kanban.policy.ts`).
2. **Função na equipe** (Proprietário(a), Supervisor(a), Responsável, Visualizador(a)) + **matriz de permissões** editável pelo ADMIN (`kanban-equipe.policy.ts`). Sem função salva: ADMIN = Proprietário(a), COLABORADOR = Responsável. ADMIN passa sempre.

## Como funciona

- Entrega leva a tarefa para a coluna de revisão; aprovar leva para concluída. Arrastar segue as mesmas regras.
- No máximo um cronômetro ativo por pessoa.
- Só ADMIN altera prazo.
- Preferências visuais (tema, opções de cartão, filtros, recolher coluna) ficam no navegador; o resto vai para a API.
- O endereço segue o nome do quadro sem acento: "Operação diária" → `operacaodiaria`.

## Conversa com

- **Minhas tarefas:** mesma tabela `Tarefa`, outra interface (legado). *Plano: Minhas tarefas abrir a tarefa aqui.*
- **Planejamento:** itens do planejamento guardam `tarefaIds`.
- **Chamados:** chamado cria tarefa, mas ela nasce sem quadro e não aparece aqui. *Plano: quadro "Chamados".*
- **Acompanhamento:** coluna concluída marca a data de entrega e o calendário mostra "Postado". *Plano: tarefa postada vira `Publicacao`.*
- **Clientes:** trocar a logo do cliente no Kanban grava no cadastro do cliente.
- **Acesso e equipe:** pessoas vêm das contas do sistema; adicionar/remover é em Configurações.

## Pendências e cuidados

- Não reescrever em React sem decisão registrada.
- "Ver como" (admin vendo como outra pessoa) desligado no sistema.
- Dias de postagem definidos antes de 2026-10-19 ficaram no navegador de quem definiu.

## Registro de mudanças

- 2026-10-24 · `feat/paginas-publicas-oauth` · Páginas públicas descrevem a integração opcional do Drive, seu escopo e a conservação dos arquivos; esta publicação contém somente os documentos e os links do login. A configuração OAuth em Production é uma etapa posterior · [Registro](../PAGINAS_PUBLICAS_OAUTH.md).

- 2026-10-19 · `feat/demandas-gerais` · Nome VVOX Sync → Demandas gerais; endereço `/demandasgerais/:quadro`; redirecionamentos de `/vvoxsync` e `/gp` · `App.tsx`, `Layout.tsx`, `features/kanban/*` · nomes internos do código mantidos.
- 2026-10-19 · `feat/kanban-equipe-backend` · Cargo, função, foto, matriz de permissões, logo de cliente e dias de postagem salvos na API; servidor aplica a matriz · migration `20261019120000_kanban_equipe`, `kanban-equipe.*`, `app.js`, `backend.js` · —
- 2026-10-14 · — · Endereço por nome do quadro (`/vvoxsync/nome`); pessoas ligadas às contas do sistema; logo volta ao menu principal · `features/kanban/*` · —
- 2026-10-10 · — · Integração do Kanban original com dados reais (quadros, colunas, tarefas, chat, anexos, áudio, links, cronômetro, entrega e aprovação) · `public/kanban/*`, `backend/src/kanban/*` · —
