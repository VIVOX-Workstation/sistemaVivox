# Portal do cliente

## Para que serve

O que o cliente vê com o próprio login: serviços contratados, publicações e
cronogramas, e um botão "Tenho interesse" para outros serviços.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/portal/entrar`, `/portal`, `/portal/acompanhamento`, `/portal/cronogramas` |
| Telas | `pages/PortalLogin.tsx`, `PortalCliente.tsx`, `PortalAcompanhamento.tsx`, `PortalCronogramas.tsx`, `components/portal/PortalHeader.tsx` |
| Backend | `backend/src/portal/` |

## Dados

Só do próprio cliente: `ServicoContratado`, `Publicacao`, `CronogramaCliente`,
`InteresseServico`. Endpoints `/portal/*`.

## Quem acessa

Papel **CLIENTE** (`@Roles(CLIENTE)`); um usuário por cliente.

## Como funciona

Login e senha gerados pela equipe no perfil do cliente.

## Conversa com

- **Clientes:** conta e interesses.
- **Acompanhamento:** mesmas publicações e cronogramas, só leitura.

## Pendências e cuidados

- O portal não recebe tarefas nem planejamento (sem progresso do serviço nem próxima entrega).

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean do portal · `Portal*.tsx` · —
- 2026-10-02 · — · Criação do portal · `backend/src/portal` · —
