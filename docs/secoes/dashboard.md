# Dashboard

## Para que serve

A primeira tela: resumo do dia com o que precisa de atenção (tarefas atrasadas,
chamados com SLA vencido, hospedagens críticas) e números de tarefas, clientes e analytics.

## Onde fica

| Parte | Caminho |
|---|---|
| Rota | `/` |
| Tela | `pages/MainDashboard.tsx` (+ `components/dashboard/DashboardShared`) |
| Backend | `GET /analytics/dashboard-executivo` em `backend/src/analytics/` |

## Dados

Só lê. Agrega `Cliente`, `ServicoContratado`, `Tarefa`, `Chamado`, `AtivoHospedagem`,
`Producao` e métricas de analytics.

## Quem acessa

Módulo **DASHBOARD** (leitura do endpoint executivo).

## Como funciona

- "Hospedagens críticas" usa 7 dias.
- O gráfico de tarefas por etapa usa o `status` do GP legado, não as colunas de Demandas gerais.

## Conversa com

Lê de quase tudo. Atalhos: tarefas → Minhas tarefas (`/gp/tarefa/:id` cai em Demandas gerais), chamados → Chamados, hospedagens → Hospedagens.

## Pendências e cuidados

- Não existe meta de entregas no backend.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean; seções antigas `components/dashboard/*Section` removidas · `MainDashboard.tsx` · —
- 2026-10-01 · — · Dados do dashboard geral e sparklines · — · —
