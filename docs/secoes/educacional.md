# Educacional

## Para que serve

Cursos internos para a equipe, com vídeos, módulos, aulas e progresso por pessoa.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/educacional`, `/educacional/curso/:id`, `/educacional/admin[/:cursoId]` |
| Telas | `pages/EducacionalHome.tsx`, `EducacionalCurso.tsx`, `EducacionalAdmin.tsx`, `EducacionalCursoEditor.tsx` |
| Backend | `backend/src/cursos/` (`educacional.controller.ts` para quem assiste, `cursos.controller.ts` para gerenciar) |

## Dados

`Curso` (`publicado`, capa), `Modulo`, `Aula` (link YouTube/Vimeo, duração),
`AulaProgresso`. Endpoints `/educacional/*`, `/cursos/*`.

## Quem acessa

Módulo **EDUCACIONAL**; gerenciar cursos: ADMIN.

## Como funciona

Reordenar módulos e aulas arrastando; duração detectada pelo link.

## Conversa com

Nenhuma outra seção.

## Pendências e cuidados

—

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean das quatro telas · `Educacional*.tsx`, `Layout.tsx` · —
- 2026-08-25 · — · Criação · `backend/src/cursos` · —
