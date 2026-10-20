# Acompanhamento

## Para que serve

Mostra **o que foi publicado para cada cliente e como performou**: planilha
mensal de publicações com métricas, resumo do mês e cronogramas em PDF. É o
que o cliente também vê no portal.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/acompanhamento`, `/acompanhamento/:clienteId` (abas Publicações e Cronogramas) |
| Telas | `pages/Acompanhamento.tsx`; tabela e cronogramas em `components/acompanhamento/*` |
| Backend | `backend/src/acompanhamento/` (`acompanhamento.service.ts`, `cronogramas.service.ts`) |

## Dados

- `Publicacao`: data, tipo (Post, Reels, Carrossel, Story, Vídeo), assunto, link, alcance, curtidas, comentários, compartilhamentos (= "Envios"), salvamentos, reposts, visualizações, `origemDado` (REPORTEI ou MANUAL).
- `CronogramaCliente`: PDF no MinIO.
- Endpoints `/acompanhamento/clientes/:id`, `/meses`, `/publicacoes` (criar, editar, importar, exportar), `/cronogramas`.

## Quem acessa

Módulo **ACOMPANHAMENTO**. O cliente vê só leitura no portal.

## Como funciona

- Números digitados à mão ou importados (Reportei / backup JSON).
- Período: mês, vários meses ou personalizado.
- "Compartilhar com o cliente" gera link para `/portal/acompanhamento`.

## Conversa com

- **Portal do cliente:** mesmas publicações e cronogramas.
- **Analytics:** hoje não conversa. Analytics já busca posts e métricas na Meta, mas não grava aqui.
- **Demandas gerais:** hoje não conversa (o calendário de lá só marca "Postado").

## Pendências e cuidados

Plano combinado (etapas 1–3 do cérebro):

1. Tarefa com "link do post"; ao aprovar, vira `Publicacao` ligada à tarefa (precisa de `Publicacao.tarefaId` e origem nova, ex. `META`).
2. Sincronização diária com a Meta pelo link; stories logo após postar (métricas somem em 24 h).
3. "Ver demanda" em cada publicação e métricas na janela da tarefa.

Limites: só contas profissionais do Instagram conectadas; Reportei e manual continuam como alternativa.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean (filtros e resumo novos; tabela e cronogramas embutidos) · `Acompanhamento.tsx` · tabela ainda no visual antigo.
- 2026-10-10 · — · Exportar/importar backup · — · —
- 2026-10-08 · — · Criação: planilha mensal, períodos, compartilhar, cronogramas em PDF · `backend/src/acompanhamento` · —
