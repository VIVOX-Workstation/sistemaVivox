# Assistente IA

## Para que serve

Chat em painel lateral disponível em todas as telas internas: responde perguntas
e pode criar card de produção a partir da conversa.

## Onde fica

| Parte | Caminho |
|---|---|
| Tela | `components/FloatingAssistant.tsx`, `components/ia/*` |
| Backend | `backend/src/ia/` (`ia.controller.ts`, `rag.service.ts`, `pesquisa.service.ts`, `agents/`) |

## Dados

Groq (chat), OpenAI (embeddings), Tavily (pesquisa). RAG por cliente em
`FonteContexto`, `DocumentoVetorial`, `InteligenciaMercado`. Endpoints `/ia/chat`,
`/ia/productions/create-from-ai` (cria `Producao`).

## Quem acessa

Qualquer usuário interno logado (sem módulo).

## Conversa com

- **Serviços e Planejamento:** ideias no planejamento e criação de produção.

## Pendências e cuidados

- Telas do "segundo cérebro" (mercado, relatório executivo, estúdio de conteúdo) existem no código mas não são usadas (memória › 5.3).

## Registro de mudanças

- 2026-10-16 · `style/layout-clean` · Assistente em painel lateral claro, botão na barra superior · `FloatingAssistant.tsx` · —
- 2026-08-05 · — · Criação · `backend/src/ia` · —
