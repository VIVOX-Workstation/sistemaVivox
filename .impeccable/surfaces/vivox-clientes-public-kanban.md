---
version: 1
slug: "vivox-clientes-public-kanban"
primary_target: "vivox-clientes/public/kanban"
related_targets: ["vivox-clientes/src/features/kanban", "route:/gp"]
---

# VVOX Sync — Kanban

- **Modo:** Operate. Usuários autenticados organizam demandas, cronometram, entregam, corrigem e aprovam trabalho.
- **Autoridade visual:** pacote `kanban-vivox-pacote-codex.zip` e export HTML enviados pelo usuário em 10/10/2026. O ZIP corresponde à pasta `C:/Users/pfeihmartins/Codex/bitrix2.0/kanban-front`. Referência estável: `.impeccable/references/claude-export-20261010-board.png`. O pacote substitui a reconstrução anterior baseada na imagem.
- **Composição:** tema branco original, barra compacta, cabeçalhos sólidos, criar tarefa acima das listas e cartões compactos. Desktop: cabeçalhos 304 × 50px em x36/y74; cartões normais 71,05px e intervalo 6px. Mobile de 390px: topo original em cinco linhas e cabeçalho em x24/y242.
- **Proveniência:** `public/kanban/css/app.css` é idêntico à fonte, SHA-256 `F09E378630F3A51B4C3E11C412CF48A417C5C2BD4721F7F3E323E16EA9171F9E`. Quatorze funções visuais de app.js foram verificadas como idênticas. O restante do JavaScript e o HTML têm adaptações para integração; não se afirma identidade integral.
- **Compatibilidade:** integration.css corrige hidden, altura natural do detalhe mobile e aparência do logo convertido em link. O antigo reference.css foi removido. Nenhum ajuste visual dessa reconstrução é carregado.
- **Arquitetura:** renderizador original em iframe e host React, sem barra lateral no canvas. A sessão e os dados vêm do sistema. Não é migração integral para JSX.
- **Preferências:** WB · Claro como padrão por migração local única; cabeçalhos preenchidos, marcador pontual e cartões compactos. Tema, exibição, recolhimento, separação e opacidade são preferências locais; plano de publicação persiste no backend.
- **Fluxos:** Kanban, criação em lote, calendário, atividade, checklist, chat, links, anexos e áudio usam dados reais. Executor/admin cronometram; proprietário/revisor/admin aprovam. Um timer ativo por usuário. A API impede que arraste contorne aprovação.
- **Revisão:** comparação visual independente aprovada nas seis capturas integradas, incluindo desktop 2298/1775, quadro mobile 390, detalhe desktop/mobile e diário real. Sem desvio material. Diferenças de conteúdo, avatares e ações decorrem dos dados e permissões.
- **Validação:** 18 verificações E2E, 21 testes unitários em três suítes, build e lint aprovados. Arraste persistiu na API e após recarga. Sem erros JavaScript ou de limpeza; fixtures removidos e diário real preservado. Relatórios da sessão em `C:/Users/pfeihmartins/Documents/Codex/2026-10-09/https-github-com-vivox-workstation-sistemavivox/work`.
- **Limites:** a revisão visual cobre as áreas capturadas. Recursos sem rota não simulam gravação; personalizações locais não são compartilhadas. Não foi feito deploy nesta validação nem migração JSX integral.
- **Execução:** `npm run dev:sync` em `vivox-clientes` inicia API 3001 e UI 5174 com infraestrutura Docker local já ligada. Consulte VVOX_SYNC.md.

## Compatibilidade com o repositório atual

Integração sobre origin/main `57ca2b4`: portal, permissões, rotas de workspaces e Minhas Tarefas preservados. O hub legado permanece em `/gp/projetos`. Builds e schema validados; 103 testes em 13 suítes aprovados. Prazo mantém a restrição ADMIN da base remota. Reimportação Bitrix, colunas custom e modal legado adaptados ao fluxo autorizado do Sync. O CSS e os renderizadores visuais permanecem os já comparados.
