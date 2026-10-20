# Clientes

## Para que serve

O cadastro central. Quase tudo no sistema pertence a um cliente: serviços,
tarefas, chamados, hospedagens, métricas, publicações, propostas e acesso ao portal.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/clientes`, `/cliente/novo`, `/cliente/:id` (abas Visão geral, Serviços, Anotações, Propostas) |
| Telas | `pages/ClientList.tsx`, `ClientForm.tsx`, `ClientProfile.tsx`, `components/ClientTabs/*` |
| Backend | `backend/src/clientes/`, `backend/src/servicos/` |

## Dados

`Cliente` (contatos em JSON, `loginsSenhas` texto livre, logo e capa, integrações
GA4/GSC/OpenPanel/Meta), `ServicoContratado`, `ServicoHistorico`, `InteresseServico`.
Endpoints `/clientes/*` (inclui `upload-logo`, `upload-banner`, `acesso-portal`, `interesses`).

## Quem acessa

Módulo **CLIENTES**; GP, ANALYTICS e ACOMPANHAMENTO leem.

## Como funciona

- Status: ATIVO, PROSPECT, PAUSADO, ENCERRADO.
- O perfil gera login e senha do portal (senha guardada criptografada para reexibir).
- Anotações salvam com botão.

## Conversa com

Todas as seções — ver [cérebro](../CEREBRO.md#os-dados-que-ligam-tudo). Destaques:
Serviços abre Planejamento ou DevBoard; "Ver tarefas" abre Minhas tarefas filtrada;
"Criar chamado" abre Chamados; a logo também é trocada pelo Kanban de Demandas gerais.

## Pendências e cuidados

- `GET /clientes/:id` devolve token da Meta e `loginsSenhas` para qualquer interno com leitura (D5 na memória).
- A lista mostra só o número de serviços, não os nomes.

## Registro de mudanças

- 2026-10-19 · `feat/kanban-equipe-backend` · Logo do cliente pode ser trocada pelo Kanban (`POST /kanban/clientes/:id/logo`) · `kanban-equipe.service.ts` · —
- 2026-10-19 · `feat/propostas-clientes` · Aba e link para Propostas · `ClientList.tsx`, `ClientProfile.tsx` · ver [propostas.md](propostas.md).
- 2026-10-16 · `style/telas-clean` · Visual clean de lista, novo cliente e perfil; novo cliente também envia GA4/GSC e vai para o perfil · `ClientList.tsx`, `ClientForm.tsx`, `ClientProfile.tsx` · —
- 2026-10-02 · — · Acesso ao portal e interesses · — · —
- 2026-08-05 · — · Criação do cadastro de clientes e serviços · — · —
