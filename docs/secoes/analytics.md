# Analytics

## Para que serve

Métricas de cada cliente: site (OpenPanel) e Instagram (Meta), com seguidores,
alcance, engajamento e melhores posts.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/analytics` (lista), `/analytics/:id` (abas Site e Instagram) |
| Telas | `pages/AnalyticsIndex.tsx`, `pages/AnalyticsDashboard.tsx`, painéis internos em `components/ClientTabs/` (`ClientPerformanceDashboard`, `InstagramPerformanceDashboard`, `InstagramManagementInsights`) |
| Backend | `backend/src/analytics/` (`instagram/`, `openpanel/`, Google) |
| Detalhes | [`docs/INSTAGRAM_INSIGHTS.md`](../INSTAGRAM_INSIGHTS.md) |

## Dados

Lidos ao vivo, com cache em memória: Meta Graph (perfil, insights da conta,
mídias e insights por mídia), OpenPanel, GA4 e Search Console. Gravados:
`AnalyticsSnapshot`, `InstagramFollowerSnapshot`. Tokens e IDs ficam no `Cliente`.

## Quem acessa

Módulos **ANALYTICS** ou **CLIENTES**; **DASHBOARD** só lê `dashboard-executivo`.

## Como funciona

- OAuth da Meta (Instagram/Facebook) ou login direto do Instagram, no perfil do cliente.
- A aba Site mostra dados de exemplo com selo "Modo demonstrativo" quando o OpenPanel não responde.
- GA4 e Search Console estão prontos no backend, mas sem tela.

## Conversa com

- **Clientes:** integrações configuradas no cadastro.
- **Dashboard:** alcance, cobertura e top clientes.
- **Acompanhamento:** *plano (etapa 2 do cérebro)* — reaproveitar a busca de mídias da Meta para gravar métricas nas publicações.

## Pendências e cuidados

- Métricas de conversão ("agendamentos pelo site") não existem.
- `GoogleAnalyticsDashboard.tsx` sem uso.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean da lista e do painel; série decorativa removida da lista · `AnalyticsIndex.tsx`, `AnalyticsDashboard.tsx` · painéis internos no visual antigo.
- 2026-09-22 · — · Correção do método de autenticação da Meta · — · —
- 2026-09-15 · — · OAuth Meta, login direto do Instagram, histórico de seguidores · `backend/src/analytics/instagram` · —
