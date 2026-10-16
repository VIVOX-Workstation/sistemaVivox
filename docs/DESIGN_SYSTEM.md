# Design System — Sistema VIVOX (telas do `vivox-clientes`)

> Escrito em 2026-10-16 a partir do código da `main` (`38b1d16`) e do protótipo
> [Sistema VIVOX — interface clean](https://claude.ai/artifact/955gUjgrSQTvjJ52K1XZGV).
> **Status: direção visual proposta.** As telas atuais ainda usam o visual
> "liquid glass" com menu preto. Toda tela nova ou redesenhada segue este arquivo.

Antes de qualquer tela, leia também:

1. [`AGENTS.md`](../AGENTS.md): regras de trabalho para pessoas e IAs.
2. [`docs/MEMORIA_DO_SISTEMA.md`](MEMORIA_DO_SISTEMA.md): como o sistema funciona de verdade e o que mudou.
3. [`docs/CRUZAMENTO_TELAS_DADOS.md`](CRUZAMENTO_TELAS_DADOS.md): cada tela, seus dados e o que já existe no backend.

---

## 0. Qual documento de design vale para quê

Há quatro fontes de design no repositório. Elas não se substituem:

| Arquivo | Vale para | Situação |
|---|---|---|
| **`docs/DESIGN_SYSTEM.md`** (este) | Todas as telas React do `vivox-clientes`, exceto o VVOX Sync | Fonte para telas novas |
| `DESIGN.md` (raiz) | **Só** o VVOX Sync (`public/kanban/`, HTML em iframe) | Não aplicar a outras telas |
| `VIVOX_DESIGN_SYSTEM.md` (raiz) | Plugin VIVOX Studio, de onde vieram os tokens | Referência de origem |
| `docs/VIVOX_PAINEL_DESIGN_SYSTEM.md` | Visual liquid glass atual (`planning-workspace.css`, `pw-*`) | Legado, em migração |

Tokens no código hoje: `vivox-clientes/src/design-system/vivox-tokens.css`, com
uma cópia em `vivox-tokens.css` na raiz (TASK-006, duplicação ainda aberta).
Grande parte das telas usa cores hexadecimais soltas no Tailwind (`text-[#1E1A16]`).
Ao mexer numa tela, troque os hexadecimais pelos tokens da seção 3.

---

## 1. Fluxo obrigatório: interface → Artifacts → git

Vale para pessoas e para qualquer IA (Claude, Codex, Cursor etc.).

1. **Ler a interface atual.** Abra a rota em `vivox-clientes/src/App.tsx`, a
   página em `pages/`, os componentes que ela monta e as chamadas em `api/`.
   Anote o que a tela mostra hoje e de onde vem cada dado.
2. **Cruzar com os dados.** Para cada campo da tela, informe o endpoint e o
   campo do Prisma (`backend/prisma/schema.prisma`). Use a tabela de
   `CRUZAMENTO_TELAS_DADOS.md`. Campo sem origem real fica marcado como
   **precisa de backend**: nunca invente o dado no front.
3. **Prototipar no Artifacts.** Crie ou edite o artboard no canvas
   [Sistema VIVOX — interface clean](https://claude.ai/artifact/955gUjgrSQTvjJ52K1XZGV),
   usando a estrutura base (seção 5) e a folha de estilo compartilhada do canvas.
   Dados de exemplo ficam claramente fictícios.
4. **Aprovar.** O responsável pelo produto aprova no próprio canvas (comentário
   ou mensagem). Sem aprovação, não implemente.
5. **Implementar no git.** Crie uma branch `feat/…`, `fix/…` ou `style/…`. Traduza
   o artboard para React + tokens. **Não cole o HTML do artboard no projeto.**
   Reaproveite componentes que já existem (`components/ui`, `components/gp`,
   `components/ClientTabs`).
6. **Validar.** Rode `npm run build` e `npm run lint` em `vivox-clientes`, e
   abra a tela no navegador como ADMIN, como COLABORADOR com módulos limitados
   e, se a tela for do portal, como CLIENTE.
7. **Registrar.** Abra o PR e adicione uma entrada em
   `MEMORIA_DO_SISTEMA.md › Registro de mudanças`.

---

## 2. Princípios do visual clean

- **Conteúdo primeiro.** Nada de grade de fundo, luz pulsando, marca d'água ou
  vidro com refração. A tela é fundo quente + cartões brancos com borda fina.
- **Dourado só para agir e selecionar.** Botão principal, item ativo do menu,
  aba ativa, foco. Nunca como fundo de área grande.
- **Uma ação principal por tela.** As demais ficam como botão secundário,
  botão fantasma ou ícone com rótulo.
- **Cor de status sempre com texto.** O selo diz "Atrasada", "Em dia",
  "SLA vencido"; a cor só reforça.
- **Pouca sombra.** Separação por borda e contraste. Sombra só em janela,
  painel lateral e menu flutuante.
- **Densidade de ferramenta de trabalho.** Texto base 13,5 px, linhas de
  tabela de 44–48 px, sem espaços vazios grandes.

---

## 3. Tokens

Nomes curtos usados no protótipo (`--sf`, `--ink`…) entre parênteses. No
React, prefira os nomes `--vivox-*`.

### Cores

| Papel | Token | Valor | Uso |
|---|---|---|---|
| Fundo da aplicação | `--vivox-background` (`--bg`) | `#F6F2EC` | Fundo de página |
| Superfície | `--vivox-surface` (`--sf`) | `#FFFFFF` | Cartão, menu, barra superior, janela |
| Superfície suave | (`--soft`) | `#FBF8F4` | Hover de linha, cabeçalho de tabela, área tracejada |
| Superfície rebaixada | (`--sk`) | `#F1EBE2` | Fundo de controle segmentado, avatar, trilho de barra |
| Borda | (`--ln`) | `rgba(80,58,30,.10)` | Bordas de cartão e divisórias |
| Borda forte | (`--ln2`) | `rgba(80,58,30,.18)` | Campos, botão secundário |
| Texto principal | `--vivox-text` (`--ink`) | `#1F1A15` | Títulos e corpo |
| Texto secundário | (`--ink2`) | `#55493C` | Rótulos, menu |
| Texto discreto | (`--ink3`) | `#6B5F52` | Metadados, legendas (6,3:1 sobre branco) |
| **Ação** | `--accent` | `#91672B` | Botão principal com texto branco (contraste 4,9:1) |
| Ação escura | `--acc-ink` | `color-mix(accent 78%, #1b1209)` | Hover do botão, texto de link |
| Ação suave | `--acc-soft` | `color-mix(accent 11%, #fff)` | Item de menu ativo, selo de destaque |
| Dourado decorativo | `--vivox-brand` | `#B89455` / `#C7A15F` | Logo, gráficos, ícones. **Nunca** com texto branco por cima (contraste 2,7:1) |
| Sucesso | `--ok` / `--ok-s` | `#2E7A4B` / `#E6F2EA` | Concluído, ativo, em dia |
| Atenção | `--warn` / `--warn-s` | `#9A5408` / `#FBEFDF` | Vence em breve, pausado, prioridade média |
| Erro | `--bad` / `--bad-s` | `#B23A30` / `#FBEAE6` | Atrasado, vencido, excluir |
| Informação | `--info` / `--info-s` | `#2B5E9C` / `#E7EEF8` | Prospect, novo, sem SLA |

Cores das etapas de tarefa (mesmas do VVOX Sync, `DESIGN.md`): fila `#7A7A80`,
produção `#C88700`, revisão `#1B79E3`, aprovação `#EA6A00`, concluída `#0E9F4F`.
Fora do Sync, use essas cores apenas como **ponto de 8 px** ou barra fina, nunca
como fundo de coluna.

### Forma, espaço e movimento

| Token | Valor |
|---|---|
| Raio de cartão | 12 px |
| Raio de campo e botão | 10 px (pequeno: 9 px) |
| Raio de janela | 16 px |
| Pílula / selo | 999 px |
| Espaçamento | múltiplos de 4 px; gap padrão 16 px entre cartões, 24 px entre seções |
| Transição | 150 ms, `cubic-bezier(.2,.8,.2,1)`; respeitar `prefers-reduced-motion` |

---

## 4. Tipografia

- Família: **Geist** (Google Fonts), com fallback `-apple-system, "Segoe UI", sans-serif`.
  O código atual usa Manrope + Archivo (liquid glass) e Inter (Sync). Telas
  novas usam Geist; não misture três famílias na mesma tela.
- Números sempre com `font-variant-numeric: tabular-nums`.

| Estilo | Tamanho / peso | Uso |
|---|---|---|
| Título de página | 24 px / 650, `letter-spacing: -.02em` | `h1` da página |
| Título de seção | 15 px / 630 | Cabeçalho de grupo |
| Título de cartão | 14 px / 620 | Dentro de `.ch` |
| Corpo | 13,5 px / 400–520 | Texto e tabelas |
| Rótulo de campo | 12,5 px / 580 | `<label>` |
| Legenda | 12 px / 400 | Metadados |
| Kicker | 11 px / 600, caixa alta, `letter-spacing: .12em` | Acima do título ("Acompanhamento mensal") |
| Número de KPI | 26 px / 620 | Cartão de indicador |

---

## 5. Estrutura base das telas internas

```
┌───────────┬──────────────────────────────────────────────┐
│ Menu      │ Barra superior: trilha › tela      [ações]   │
│ lateral   ├──────────────────────────────────────────────┤
│ 232–244px │ Página (máx. 1240 px, padding 28/32 px)      │
│           │  Kicker                                       │
│ Módulos   │  Título da página            [secundária][principal]
│ filtrados │  Descrição curta                              │
│ por       │  ── conteúdo ──                               │
│ permissão │                                               │
│ ───────── │                                               │
│ Config.   │                                               │
│ Pessoa ⏻  │                                               │
└───────────┴──────────────────────────────────────────────┘
```

- **Menu lateral** (`.sb`): fundo branco, borda direita, logo VIVOX + "Sistema".
  Itens de 38 px; ativo com `--acc-soft`. Mostra só os módulos de
  `podeAcessar()`. Configurações só para ADMIN. A seção "Em breve" sai do menu
  (se precisar existir, fica numa linha discreta só para ADMIN).
- **Barra superior** (`.top`): 64 px, trilha de navegação à esquerda, ações da
  tela e o botão do assistente IA à direita.
- **Assistente IA**: abre um painel lateral de 400 px pelo botão da barra
  superior. O botão flutuante atual (`FloatingAssistant`) deixa de ser flutuante.
- **VVOX Sync** não usa esta estrutura: tela cheia, sem menu lateral, com o logo
  levando de volta ao sistema (regra do `DESIGN.md`).
- **Portal do cliente**: sem menu lateral; cabeçalho com nome do cliente,
  abas Serviços / Acompanhamento / Cronogramas e Sair.
- **Celular** (≤ 760 px): o menu vira faixa horizontal rolável no topo, grades
  viram uma coluna, tabelas rolam dentro do cartão.

---

## 6. Componentes

Classes do protótipo entre parênteses. No React, crie componentes com o mesmo
papel; não espalhe as classes à mão.

| Componente | Variações | Regras |
|---|---|---|
| Botão (`.btn`) | `pri` (ação), `sec` (contorno), `gh` (fantasma), `dg` (excluir); `sm` 32 px | 38 px de altura. Um `pri` por área. Ícone 16 px à esquerda do texto |
| Botão de ícone (`.ib`) | normal 36 px, `sm` 30 px, `on` | Sempre com `aria-label` |
| Cartão (`.card`) | com cabeçalho `.ch` ou padding `.cp` | Borda `--ln`, raio 12 px, sem sombra |
| Indicador (`.kpi`) | `alert` (número em vermelho) | Rótulo, número, legenda. Clicável quando leva a uma lista |
| Filtro (`.chip`) | `on` (preto) | Pílula com contagem em `<em>`. Para filtros de lista |
| Controle segmentado (`.seg`) | — | Para alternar visualização (Lista / Prazos, 7 / 30 / 90 dias) |
| Abas (`.tabs` / `.tab`) | `on` (sublinhado dourado) | Para seções da mesma entidade (perfil, configurações) |
| Selo (`.bd`) | `ok`, `warn`, `bad`, `info`, `acc`; `plain` sem ponto | Sempre com texto de status |
| Tabela (`.tbl`) | `.r` à direita, `.c` centro | Cabeçalho 11,5 px caixa alta; dentro de `.tw` para rolar |
| Campo (`.fld` + `.inp`) | `input`, `select`, `textarea` | `<label for>` sempre. Foco com anel dourado |
| Busca (`.srch`) | — | Ícone dentro do campo, 220–420 px |
| Interruptor (`.tgl`) | `on` | `role="switch"` + `aria-checked` |
| Linha de lista (`.row`) | `a.row` clicável | Ícone/selo + título + legenda + seta |
| Monograma (`.mono`), avatar (`.av`) | `lg`, `sm` | Iniciais quando não há logo ou foto |
| Barra de progresso (`.bar`) | — | 6 px; texto do valor ao lado |
| Janela (`.ov` + `.dlg`) | `lg` 760 px | Título, descrição de uma linha, corpo, rodapé com Cancelar + ação |
| Painel lateral (`.drw`) | 400–460 px | Detalhe de item sem sair da lista; assistente IA |
| Estado vazio (`.empty`) | — | Título + o que fazer + botão |

---

## 7. Padrões de tela

| Padrão | Use em | Estrutura |
|---|---|---|
| Lista com filtros | Clientes, Hospedagens, Analytics | Título + ação principal; busca + filtros; tabela ou grade de cartões |
| Perfil com abas | Perfil do cliente, Configurações | Cabeçalho da entidade + ações; abas; conteúdo da aba |
| Lista + detalhe | Planejamento, Curso | Lista estreita (340 px) à esquerda; editor ou leitor à direita |
| Quadro | DevBoard, Chamados | Colunas com ponto de cor + contagem; cartões clicáveis; detalhe em painel lateral ou janela |
| Formulário em seções | Novo cliente | Cada seção com título e explicação à esquerda e campos à direita |
| Painel de indicadores | Dashboard, Analytics do cliente | Até 6 indicadores; "precisa de atenção" antes dos gráficos; gráficos em abas, não empilhados |

---

## 8. Estados obrigatórios

Toda tela que busca dados precisa de:

- **Carregando**: esqueleto com o formato do conteúdo (`aria-busy="true"`), não spinner solto.
- **Erro**: mensagem curta + "Tentar de novo". Se já havia dado, mantenha o dado e mostre o aviso acima.
- **Vazio**: o que falta + ação para resolver ("Nenhum cliente encontrado. Limpar filtros").
- **Dado de exemplo**: se a tela mostrar dado fictício (ex.: OpenPanel fora do ar), exiba o selo **"Modo demonstrativo"**, como faz o `ClientPerformanceDashboard`. Nunca mostre número inventado sem esse aviso.
- **Salvando / salvo**: em edição automática, indicador "Salvando…" / "Salvo" na barra superior.

---

## 9. Permissões na interface

- Esconder um item na interface **não** protege o dado. Toda rota nova do
  backend precisa de `@UseGuards(JwtAuthGuard)` e `@RequerModulo(...)` (ou
  `@Roles` para telas só de ADMIN). Detalhes em `MEMORIA_DO_SISTEMA.md › Permissões`.
- No front: rota dentro de `ModuloRoute` em `App.tsx`, item de menu com
  `podeAcessar('MODULO')`, botões só de ADMIN com `user.role === 'ADMIN'`.
- Telas só de ADMIN mostram o selo "Só administradores" na barra superior.

---

## 10. Escrita

- Português do Brasil, frases curtas, verbo no início dos botões ("Salvar cliente", "Criar chamado").
- Nomes dos módulos como no menu: Dashboard, Clientes, Hospedagens, Analytics, Acompanhamento, VVOX Sync, Minhas tarefas, Chamados, Educacional, Configurações.
- Status com os mesmos nomes do backend, traduzidos: `ATIVO` → Ativo, `EM_ANDAMENTO` → Em atendimento (chamado), `PENDENTE_RENOVACAO` → Pendente de renovação.
- Sem emoji na interface e em textos gerados pelo sistema.

---

## 11. Acessibilidade

- Elementos clicáveis são `<button>` ou `<a href>`; nunca `onClick` em `div`.
- Contraste mínimo de 4,5:1 para texto. Texto branco só sobre `--accent` (`#91672B`) ou mais escuro.
- Foco visível em todos os controles (anel de 2 px com `--ring`).
- Ícone sozinho precisa de `aria-label`; ícone decorativo usa `aria-hidden="true"`.
- Janelas com `role="dialog"`, `aria-modal="true"` e título ligado por `aria-labelledby`.

---

## 12. O que não fazer

- Não criar um quarto arquivo de design; ajuste este.
- Não aplicar as regras do `DESIGN.md` (Sync) a outras telas, nem o contrário.
- Não usar dourado decorativo (`#B89455`, `#C7A15F`, `#CCB691`) como fundo de botão com texto branco.
- Não adicionar efeitos de fundo (grade, luz, vidro, marca d'água) em telas novas.
- Não inventar campo, métrica ou status que não existe no backend. Marque como "precisa de backend" e peça a mudança.
- Não guardar dado de negócio no `localStorage` (ver armadilhas na memória do sistema).

---

## 13. Migração do visual atual

| Hoje | Clean |
|---|---|
| Menu preto com grade e luz dourada (`Layout.tsx`, `SIDEBAR_CSS`) | Menu branco `.sb` |
| Painéis `pw-glass-panel` e `useLiquidGlass` | `.card` sem efeito |
| Marca d'água `marca.webp` no canto | Removida |
| Assistente flutuante (`FloatingAssistant`) | Botão na barra superior + painel lateral |
| Seção "Em breve" no menu | Removida ou linha discreta só para ADMIN |
| Hexadecimais soltos no Tailwind | Tokens da seção 3 |
| Manrope + Archivo | Geist |

Migre uma tela por PR, começando pelas de maior uso (Dashboard, Clientes,
Perfil). Registre cada tela migrada na memória do sistema.
