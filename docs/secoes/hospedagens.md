# Hospedagens

## Para que serve

Radar de domínios, VPS e SSL dos clientes, com os vencimentos que precisam de atenção.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/hospedagens`, `/renovacoes` |
| Tela | `pages/HostingRadar.tsx` |
| Backend | `backend/src/hospedagem/` (`prazo-hospedagem.ts` calcula os níveis) |
| Detalhes | [`docs/HOSPEDAGEM_LANDING_PAGES.md`](../HOSPEDAGEM_LANDING_PAGES.md) |

## Dados

`AtivoHospedagem` (domínio, VPS, `sslAtivo` sim/não, ciclo, custo, valor cobrado,
`dataExpiracaoDominio`, `dataRenovacaoVps`, `itemPlanejadoId`). Endpoint `GET /hospedagens/radar`.

## Quem acessa

Módulos **HOSPEDAGENS** ou **CLIENTES**.

## Como funciona

Níveis: crítico (≤ 7 dias ou vencido), atenção (≤ 30), em dia, sem data.

## Conversa com

- **Clientes:** cadastro no perfil do cliente; "Abrir cliente" leva à aba Serviços.
- **Planejamento:** hospedagem da landing page de uma entrega.
- **Dashboard:** críticas e próximos vencimentos.

## Pendências e cuidados

- SSL não tem data de vencimento.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean do radar · `HostingRadar.tsx` · —
- 2026-10-01 · — · Prazo de hospedagem no dashboard · — · —
- 2026-08-05 · — · Criação · — · —
