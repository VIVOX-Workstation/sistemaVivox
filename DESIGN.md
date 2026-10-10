---
name: "VVOX Sync — Kanban"
description: "Interface do pacote Claude enviado pelo usuário, integrada aos dados reais."
colors:
  bg: "#FFFFFF"
  col: "#F4F4F5"
  card: "#FFFFFF"
  fg: "#111111"
  fg-2: "#333336"
  muted: "#57575C"
  subtle: "#6E6E73"
  gold: "#B89455"
  gold-ink: "#7E5E2D"
  line: "#E4E4E7"
  line-2: "#CDCDD2"
  sw-gray: "#7A7A80"
  sw-gold: "#C88700"
  sw-blue: "#1B79E3"
  sw-orange: "#EA6A00"
  sw-green: "#0E9F4F"
  danger: "#B83B32"
  ok: "#247A4A"
typography:
  body:
    fontFamily: '-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif'
    fontSize: "12.5px"
    lineHeight: 1.5
  column-title:
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.5
  card-title:
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.35
rounded:
  card: "11px"
  header: "16px"
  list: "20px"
  pill: "999px"
  control: "8px"
spacing:
  card-gap: "6px"
  list-inset: "8px"
  column-gap: "10px"
  card-inline: "12px"
  card-block: "10px"
components:
  column-header:
    backgroundColor: "{colors.sw-blue}"
    textColor: "{colors.card}"
    rounded: "{rounded.header}"
    width: "304px"
    height: "50px"
    padding: "6px 8px 6px 14px"
  task-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.fg}"
    rounded: "{rounded.card}"
    padding: "10px 12px"
  create-task:
    backgroundColor: "{colors.card}"
    textColor: "{colors.fg-2}"
    rounded: "{rounded.pill}"
    height: "38px"
    padding: "0 12px"
---

# Design System: VVOX Sync — Kanban

## Overview

**Creative North Star: "Fidelidade ao pacote original enviado pelo usuário"**

Registro exclusivo do Kanban. A autoridade visual é o pacote `kanban-vivox-pacote-codex.zip`, recebido em 10/10/2026, cujo conteúdo corresponde a `C:/Users/pfeihmartins/Codex/bitrix2.0/kanban-front`. O HTML monolítico enviado acompanha a mesma fonte visual. A captura estável desta versão é `.impeccable/references/claude-export-20261010-board.png`. A imagem anterior continua como contexto, sem substituir o novo código fornecido.

**Key Characteristics:**

- Barra compacta com logo, quadros, busca, filtros, visualizações e ações.
- Cabeçalhos sólidos, criar tarefa acima das listas claras e cartões compactos.
- Detalhe com informações e conversa lado a lado, empilhadas no celular.
- Conteúdo, contagens, pessoas e ações disponíveis refletem dados e permissões reais.

## Colors

O frontmatter registra o tema branco original. Ações principais usam o gradiente dourado da fonte; seleções usam dourado translúcido. As cinco etapas usam cinza, dourado, azul, laranja e verde. A coluna concluída inicia separada ao fim, com opacidade 0,25; foco e hover restauram sua opacidade. Essa preferência não muda o token verde.

O tema inicial é WB · Claro. A migração local de preferências aplica essa escolha uma vez; os demais temas e controles originais continuam disponíveis.

## Typography

A pilha de fontes, títulos e metadados é a da fonte enviada. Números e prazos usam algarismos tabulares. Não há um título de página adicional acima da barra do quadro.

## Layout

Na captura desktop de 2298 × 1252, a barra começa em x36/y24 e mede 36px de altura. O primeiro cabeçalho começa em x36/y74 e mede 304 × 50px. Cartões normais medem aproximadamente 71,05px, com divisor a 35,55px do topo e intervalo de 6px. Flags, títulos longos e cronômetros aumentam sua altura conforme o conteúdo.

O quadro mantém rolagem horizontal. Em 390 × 844, o topo original ocupa cinco linhas e o primeiro cabeçalho começa em x24/y242; as abas têm 308px disponíveis. O detalhe empilha até 860px. A correção de altura natural em `integration.css` impede a sobreposição das seções no celular.

O host React não reserva espaço para a barra lateral no canvas Sync.

## Elevation & Depth

Cabeçalhos e criar tarefa usam a sombra `--lift` original. Cartões têm realce interno, respondem ao hover com leve deslocamento e ao arraste com elevação. O divisor interno usa a cor de borda com opacidade 0,35. Menus e detalhes mantêm as sombras originais.

As transições, animações e regras de movimento reduzido permanecem no CSS fornecido.

## Shapes

Cartões, cabeçalhos, listas e pílulas seguem os raios do frontmatter. A fonte utiliza `corner-shape:squircle` nos navegadores compatíveis. Ícones, logo e proporções seguem o export.

## Components

- **Barra:** o logo retorna à área de projetos; busca, filtros e opções mantêm a composição original.
- **Visualizações:** Quadro, Calendário e Atividade usam tarefas e histórico reais. Seus renderizadores visuais seguem a fonte.
- **Cartões:** prazo, etapas, timer e responsável aparecem conforme conteúdo e opções de exibição.
- **Criação:** o diálogo original permite criar uma ou várias tarefas com persistência na API.
- **Detalhe:** descrição, anexos, links, etapas, pessoas, cronômetro e conversa usam o modelo visual original.
- **Integração:** HTML e JavaScript recebem autenticação, persistência e autorização. O CSS principal é uma cópia byte a byte da fonte. A integração permanece em iframe com host React; não é uma migração integral para JSX.

## Do's and Don'ts

### Do:

- Do preservar o CSS, a composição e os renderizadores visuais do pacote aceito.
- Do manter correções de compatibilidade em integration.css.
- Do usar dados e permissões reais, preservando foco visível e movimento reduzido.

### Don't:

- Don't substituir o pacote atual pela reconstrução da imagem anterior.
- Don't adicionar tarefas, fotos ou contagens fictícias para imitar a captura.
- Don't estender estas regras visuais aos demais módulos do sistema.
