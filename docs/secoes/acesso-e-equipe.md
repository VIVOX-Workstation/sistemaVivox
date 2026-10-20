# Acesso e equipe

## Para que serve

Quem entra no sistema, com qual papel e quais módulos. Configurações da equipe
e da própria conta.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/login`, `/sem-acesso`, `/configuracoes` (só ADMIN) |
| Telas | `pages/Login.tsx` + `components/LoginVivox.tsx`, `pages/Configuracoes.tsx`, `SemAcesso` em `App.tsx` |
| Proteção no front | `App.tsx` (`InternalRoute`, `ModuloRoute`, `AdminRoute`), `context/AuthContext.tsx` |
| Backend | `backend/src/auth/`, `backend/src/users/` |

## Dados

`User` (papel `ADMIN`/`COLABORADOR`/`CLIENTE`, `modulos[]`, `clienteId` do portal,
e para Demandas gerais `cargo`, `funcaoKanban`, `fotoUrl`). Endpoints `/auth/login`,
`/auth/me`, `/users/*`.

## Quem acessa

Login: todos. Configurações: ADMIN. Editar a própria conta: o próprio usuário.

## Como funciona

As regras completas (guards, `@RequerModulo`, tabela por controller) estão em
[`MEMORIA_DO_SISTEMA.md › 2`](../MEMORIA_DO_SISTEMA.md#2-papéis-e-permissões-como-funciona-de-verdade).
Usuário novo nasce com os 7 módulos; o admin tira.

## Conversa com

- **Todas as seções:** módulos decidem o que aparece no menu e o que a API aceita.
- **Demandas gerais:** pessoas do Kanban são as contas daqui; cargo e função são editados no painel de colaboradores do Kanban.
- **Portal:** contas `CLIENTE` são criadas no perfil do cliente.

## Pendências e cuidados

- D1: `POST /auth/esqueci-senha` não existe.
- D3/D4: senha sem bcrypt no `PATCH /users/:id`; `POST /users` devolve o hash.
- Configurações não oferece excluir usuário (a rota existe).

## Registro de mudanças

- 2026-10-19 · `feat/kanban-equipe-backend` · `User` ganha cargo, função no Kanban e foto; `GET /users` devolve esses campos · `users.service.ts`, migration `20261019120000_kanban_equipe` · —
- 2026-10-16 · `style/telas-clean` · Visual clean de Configurações e Sem acesso · `Configuracoes.tsx`, `App.tsx` · —
- 2026-10-14 · — · Nova tela de login preta com luz dourada · `LoginVivox.tsx` · —
- 2026-10-06 · — · Permissões por módulo (`User.modulos`, `@RequerModulo`) · — · —
