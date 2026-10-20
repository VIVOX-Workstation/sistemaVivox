# Propostas

## Para que serve

Propostas comerciais por cliente, editáveis por seções, com um link exclusivo
para o destinatário ler sem login.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/cliente/:id?tab=propostas` (equipe), `/proposta/:token` (público) |
| Telas | `vivox-clientes/src/features/propostas/` |
| Backend | `backend/src/propostas/` |
| Prévia no WhatsApp | `vivox-clientes/nginx.conf` (Open Graph em `/proposta/:token`) |

## Dados

`Proposta` (título, destinatário, apresentação, validade, cor, `secoes` em JSON
com Markdown ou HTML sanitizado, `linkHash`, `linkTokenCriptografado`).
Endpoints `/clientes/:id/propostas[/:pid[/compartilhar]]`, `GET /propostas-publicas/:token`.

## Quem acessa

Módulo **CLIENTES** (ADMIN e COLABORADOR). O link público não exige sessão.

## Como funciona

As regras detalhadas (capa, subcapa, PDF, HTML seguro, links recuperáveis,
revogação) estão em [`MEMORIA_DO_SISTEMA.md › 5`](../MEMORIA_DO_SISTEMA.md#propostas-comerciais).

## Conversa com

- **Clientes:** pertence ao cliente; o destinatário é do documento e não altera o cadastro.
- Nenhuma outra seção hoje (não vira contrato nem serviço).

## Pendências e cuidados

- Sem aceite/assinatura nem conversão em contrato.
- Rotacionar `JWT_SECRET` exige gerar novos links para recuperá-los.

## Registro de mudanças

- 2026-10-20 · `fix/excluir-proposta-listagem` · Excluir pela listagem; consultar o link ativo sem renovar; token criptografado; prévia Open Graph · `PropostasService`, migration `20261020120000_proposta_link_recuperavel`, `PropostasTab`, `vivox-clientes/nginx.conf` · conferir prévia no WhatsApp após deploy.
- 2026-10-19 · `feat/propostas-clientes` · Criação: modelo de ensino, edição por seções, capa/subcapa/encerramento, rolagem contínua, PDF, link público revogável, paleta dourada · `features/propostas`, `backend/src/propostas` · —
