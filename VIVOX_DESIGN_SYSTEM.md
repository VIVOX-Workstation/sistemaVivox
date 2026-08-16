# VIVOX Studio Design System

Sistema visual extraído da interface consolidada do plugin VIVOX Studio para reutilização em produtos desktop, plugins, painéis administrativos e aplicações web.

## 1. Identidade

O VIVOX combina uma aparência editorial premium com uma interface operacional compacta. A marca não depende de efeitos chamativos: o caráter vem da paleta quente, superfícies levemente amarronzadas, tipografia sóbria, contornos precisos e movimento discreto.

Princípios:

- conteúdo acima da decoração;
- dourado como ação e seleção, não como preenchimento indiscriminado;
- superfícies quentes em vez de cinzas neutros;
- pouca sombra e separação prioritariamente por contraste e contorno;
- controles compactos, porém legíveis;
- animação usada para indicar estado e hierarquia;
- modo claro e escuro com a mesma semântica.

## 2. Arquivos reutilizáveis

- `vivox-tokens.css`: tokens semânticos portáteis.
- `VIVOX_DESIGN_SYSTEM.md`: regras, componentes e exemplos.

Importação:

```css
@import "./design-system/vivox-tokens.css";
```

Aplicação do tema:

```html
<body data-theme="light">
```

ou:

```html
<body data-theme="dark">
```

## 3. Cores

### Tema escuro

| Papel | Token | Valor |
| --- | --- | --- |
| Fundo da aplicação | `--vivox-background` | `#11100E` |
| Superfície principal | `--vivox-surface` | `#181612` |
| Superfície elevada | `--vivox-surface-raised` | `#221F1A` |
| Superfície forte | `--vivox-surface-strong` | `#2B261F` |
| Borda | `--vivox-border` | `#373126` |
| Borda enfatizada | `--vivox-border-strong` | `#4A4032` |
| Texto principal | `--vivox-text` | `#F6F0E7` |
| Texto secundário | `--vivox-text-muted` | `#B9AEA0` |
| Texto discreto | `--vivox-text-subtle` | `#8F8271` |
| Marca/ação | `--vivox-brand` | `#C7A15F` |
| Marca em hover | `--vivox-brand-hover` | `#D1B174` |
| Sucesso | `--vivox-success` | `#5FC48B` |
| Erro | `--vivox-danger` | `#F06A63` |

### Tema claro

| Papel | Token | Valor |
| --- | --- | --- |
| Fundo da aplicação | `--vivox-background` | `#F6F0E7` |
| Superfície principal | `--vivox-surface` | `#FFFDF8` |
| Superfície elevada | `--vivox-surface-raised` | `#EEE7DC` |
| Superfície forte | `--vivox-surface-strong` | `#E5D9C8` |
| Borda | `--vivox-border` | `#D8CBB8` |
| Borda enfatizada | `--vivox-border-strong` | `#C5B59D` |
| Texto principal | `--vivox-text` | `#1E1A16` |
| Texto secundário | `--vivox-text-muted` | `#625746` |
| Texto discreto | `--vivox-text-subtle` | `#847663` |
| Marca/ação | `--vivox-brand` | `#B89455` |
| Marca em hover | `--vivox-brand-hover` | `#9E7A3F` |
| Sucesso | `--vivox-success` | `#247A4A` |
| Erro | `--vivox-danger` | `#B83B32` |

### Regras de uso

- Use `brand` para CTA principal, seleção ativa, foco e pequenos destaques.
- Não use dourado em grandes áreas de fundo.
- Use `success` somente para confirmação ou conclusão.
- Use `danger` para erro, exclusão e bloqueio.
- Texto sobre `brand` deve usar `--vivox-on-brand`.
- Não codifique cores diferentes em componentes; use tokens semânticos.

## 4. Tipografia

Família base:

```css
font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
```

Escala recomendada:

| Estilo | Tamanho | Peso | Entrelinha | Uso |
| --- | ---: | ---: | ---: | --- |
| Título de tela | 13–14px | 650 | 1.25 | Cabeçalhos principais |
| Título de card | 11–12px | 650–700 | 1.30 | Identificação de blocos |
| Corpo | 11–12px | 400–500 | 1.45–1.50 | Conteúdo e formulários |
| Controle | 10–12px | 600–650 | 1.10 | Botões, tabs e pills |
| Legenda | 9–10px | 500–600 | 1.35 | Metadados e ajuda |
| Kicker/seção | 9px | 650–800 | 1.10 | Texto uppercase com tracking |

Cabeçalhos de seção:

```css
.vivox-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vivox-text-muted);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.vivox-section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--vivox-border);
}
```

## 5. Espaçamento e geometria

Escala base: múltiplos de `4px`.

| Token | Valor | Uso |
| --- | ---: | --- |
| `space-1` | 4px | Ícone/texto, controles densos |
| `space-2` | 8px | Campos próximos e ações |
| `space-3` | 12px | Gap padrão de cards |
| `space-4` | 16px | Padding externo |
| `space-5` | 20px | Separação de grupos |
| `space-6` | 24px | Seções maiores |

Raios:

- `8px`: controles internos, ícones e pills retangulares;
- `11px`: cards, campos e botões principais;
- `999px`: badges, toggles e grupos segmentados.

Use raios concêntricos: o raio externo deve considerar o raio interno mais o padding entre as duas superfícies.

## 6. Superfícies

### Card padrão

```css
.vivox-card {
  display: flex;
  flex-direction: column;
  gap: var(--vivox-space-3);
  padding: 14px;
  border: 1px solid var(--vivox-border);
  border-radius: var(--vivox-radius-md);
  background: var(--vivox-surface);
  box-shadow: var(--vivox-shadow-panel);
}
```

### Card selecionável

- estado normal: borda semântica padrão;
- hover: elevação de `-2px` e ring dourado discreto;
- selecionado: outline dourado com baixa opacidade;
- pressionado: `scale(0.96)`.

### Imagens

Use outline interno neutro, sem alterar layout:

```css
.vivox-image {
  outline: 1px solid oklch(0 0 0 / 0.1);
  outline-offset: -1px;
}

[data-theme="dark"] .vivox-image {
  outline-color: oklch(1 0 0 / 0.1);
}
```

## 7. Botões

Altura mínima padrão: `40px`. Para aplicações touch, prefira `44px`.

### Primário

```css
.vivox-button-primary {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(126, 94, 45, 0.28);
  border-radius: var(--vivox-radius-md);
  background: var(--vivox-brand);
  color: var(--vivox-on-brand);
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.vivox-button-primary:hover {
  background: var(--vivox-brand-hover);
}

.vivox-button-primary:active {
  transform: scale(0.96);
}
```

### Secundário

- fundo `surface-raised`;
- borda `border`;
- texto `text-muted`;
- hover com borda dourada translúcida e texto principal.

### Ícone

- caixa visível: `34 × 34px`;
- raio: `8–10px`;
- SVG: `15–16px`;
- stroke: `2–2.25px`;
- área clicável recomendada: pelo menos `40 × 40px` em desktop.

### Estados

- disabled: opacidade `0.30–0.42`, sem elevação;
- loading: preserve a largura do botão e substitua o ícone por spinner;
- destructive: use `danger` apenas no hover/confirmação;
- active: fundo `brand`, texto `on-brand`.

## 8. Formulários

```css
.vivox-field {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--vivox-border);
  border-radius: var(--vivox-radius-sm);
  outline: none;
  background: var(--vivox-surface-raised);
  color: var(--vivox-text);
  font: inherit;
  font-size: 12px;
}

.vivox-field:focus {
  border-color: rgba(184, 148, 85, 0.50);
  box-shadow: 0 0 0 2px rgba(184, 148, 85, 0.12);
}
```

Regras:

- label a `11px`, peso `500`, cor secundária;
- distância label/campo de `5px`;
- textarea com entrelinha `1.5` e redimensionamento vertical;
- placeholder deve ser mais discreto que o label;
- erro abaixo do campo, sem substituir o label;
- obrigatório deve usar pill curta, não texto solto em outra linha.

## 9. Tabs, pills e controles segmentados

### Tabs

- altura de `32px`;
- fundo elevado e borda no estado padrão;
- ativo com fundo dourado e texto escuro;
- texto uppercase opcional com tracking de `0.05em`;
- evite mais de seis tabs visíveis em uma única linha.

### Pills

- altura mínima de `28–30px`;
- raio completo;
- padding horizontal de `9–10px`;
- ativo com fundo dourado;
- use para filtros e escolhas mutuamente exclusivas, não para ações destrutivas.

### Toggle

- trilho `42 × 24px`;
- knob `16 × 16px`;
- padding interno `3px`;
- deslocamento de `18px`;
- movimento em `190–220ms`.

## 10. Ícones

Diretrizes:

- preferir SVG outline;
- viewBox `0 0 24 24`;
- `fill: none`;
- `stroke: currentColor`;
- `stroke-linecap: round`;
- `stroke-linejoin: round`;
- stroke normal `2.0–2.25px`;
- tamanho dentro de controles `14–16px`;
- não misturar símbolos Unicode com SVGs no mesmo grupo de ações;
- cada ícone deve representar diretamente sua função;
- controles somente com ícone devem apresentar tooltip e `aria-label`.

## 11. Feedback

### Toast

- formato pill;
- conteúdo curto em uma linha sempre que possível;
- sucesso verde, erro vermelho e informação neutra;
- entrada com opacidade, leve deslocamento vertical e blur;
- duração visual aproximada de `240ms`;
- não confirmar uma ação que não possa ser verificada.

### Modal

- backdrop preto com aproximadamente `48%` de opacidade;
- conteúdo centralizado;
- fechamento explícito em fluxos que podem perder trabalho;
- entrada com `translateY(10px)`, escala `0.985` e blur `3px`;
- respeitar `prefers-reduced-motion`.

### Tooltip

- fundo `#211E19`;
- texto branco;
- tamanho `9px`;
- padding `6px 8px`;
- raio `7px`;
- atraso visual mínimo;
- máximo aproximado de `190px` para textos explicativos.

## 12. Movimento

| Token | Valor | Uso |
| --- | --- | --- |
| `motion-fast` | `140ms` | Press, ícones e resposta imediata |
| `motion-ui` | `190ms` | Hover, seleção e toggles |
| `motion-panel` | `240ms` | Modais, painéis e conteúdo revelado |
| `ease-out` | `cubic-bezier(0.23,1,0.32,1)` | Entrada e interação |
| `ease-inout` | `cubic-bezier(0.77,0,0.175,1)` | Transições de estado contínuas |

Regras:

- pressione com `scale(0.96)`;
- hover de card pode usar `translateY(-2px)`;
- hover de ícone pode usar `translateY(-1px)`;
- não use `transition: all`;
- aplique transição apenas a propriedades necessárias;
- use `will-change` apenas durante modal ou animação complexa;
- não use animação decorativa em listas densas.

## 13. Layout responsivo

- padding padrão da área rolável: `14px`;
- gap entre seções: `14px`;
- grids de duas colunas devem virar uma coluna abaixo de `520–560px`;
- grupos de ações podem quebrar linha, mas ações primárias permanecem mais largas;
- cabeçalhos e tabs críticos podem permanecer sticky;
- evite texto abaixo de `9px` em conteúdo essencial.

## 14. Acessibilidade

- contraste mínimo WCAG AA para texto de corpo;
- foco visível com ring dourado;
- `aria-label` em botões somente com ícone;
- tooltip não substitui o nome acessível;
- não depender apenas de cor para sucesso e erro;
- respeitar `prefers-reduced-motion`;
- áreas de clique: `40px` em desktop e `44px` em touch;
- disabled deve usar atributo real, não apenas opacidade.

## 15. Exemplo mínimo

```html
<section class="vivox-card">
  <div class="vivox-section-title">Informações</div>

  <label>
    Nome do cliente
    <input class="vivox-field" type="text" />
  </label>

  <div style="display:flex; gap:8px">
    <button class="vivox-button-secondary">Cancelar</button>
    <button class="vivox-button-primary">Salvar</button>
  </div>
</section>
```

## 16. Checklist para novas interfaces

- Os componentes usam tokens semânticos?
- O dourado está reservado para ação e seleção?
- Os cards usam raio de `11px` e controles internos `8px`?
- Botões têm pelo menos `40px` de altura?
- SVGs possuem peso visual consistente?
- Campos têm foco visível?
- Estados loading, vazio, erro, sucesso e disabled foram previstos?
- O modo claro mantém a mesma hierarquia do escuro?
- A interface funciona com movimento reduzido?
- A densidade está adequada ao tamanho da janela?

