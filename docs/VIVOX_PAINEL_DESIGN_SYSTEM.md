# Referência visual do painel Vivox

Fonte inspecionada: https://painel.vivoxmarketing.com.br/ em 01/10/2026. Valores obtidos das regras CSS e estilos computados da página pública, sem acesso ao código-fonte do projeto.

## Cores

| Uso | Valor observado |
| --- | --- |
| Fundo | `#f8f6f6` |
| Fundo secundário | `#efeae2` |
| Superfície | `#ffffff` |
| Hover de linha | `#faf7f2` |
| Pílula | `#ede7dd` |
| Texto principal | `#1e1b17` |
| Texto secundário | `#5e574c` |
| Dourado | `#ccb691` |
| Texto sobre detalhes dourados | `#7a6440` |
| Marrom | `#524b40` |
| Borda | `#524b4029` |
| Borda suave | `#524b4017` |
| Borda forte | `#524b4057` |
| Erro / fundo de erro | `#b42318` / `#fbece9` |
| Atenção / fundo de atenção | `#b54708` / `#fcefe2` |
| Sucesso / fundo de sucesso | `#3d6b35` / `#eaf2e7` |

## Tipografia e formas

- Corpo e controles: **Manrope**, pesos 400–700.
- Títulos: **Archivo**, peso 600–700. Alguns títulos usam largura ampliada (`font-stretch`).
- Cards: raio de **18px**, borda fina, superfície branca.
- Campos: raio de **8–12px**.
- Filtros e botões compactos: raio de **999px**, altura observada de 32–34px.
- Rótulos de seção: Archivo, caixa alta, espaçamento entre letras de `0.16em`, cor `#7a6440`.
- Cabeçalhos de card: conteúdo e ações alinhados, borda inferior discreta.
- Hierarquia: cabeçalho compacto, controles próximos ao conteúdo e cards agrupados por finalidade.

O painel usa escala compacta para exibição de muitas demandas. Na tela de edição, os textos e campos precisam ser maiores para leitura e preenchimento confortável; não copiar a escala de modo TV literalmente.

## Aplicação ao planejamento

1. Cabeçalho com contexto do cliente, título editável e status.
2. Abas logo abaixo do cabeçalho: Briefing, Conteúdo, Produção e Publicação.
3. Links finais e hospedagem em Publicação, sem ocupar a primeira tela de briefing.
4. Criação de tarefas em Produção; suporte após entrega em Publicação.
5. Resumo compacto de prazo e progresso, sem duplicar campos editáveis.
## Implementação no Frontend (vivox-clientes)

- **Fontes self-hosted**: `public/fonts/manrope.woff2` e `public/fonts/archivo.woff2` baixadas dos assets estáticos de produção do painel.
- **CSS escopado**: `src/pages/planning-workspace.css` definindo variáveis `--pw-*` sob o seletor `.planning-workspace`, garantindo que os tokens globais e o tema da sidebar não sejam afetados.
- **Consolidação de URL**: Campo único na aba Publicação mantendo sincronização simultânea de `itemAtivo.linkFinal` e `hospedagemUrl`.

Esta extração documenta a aparência observada; não representa uma biblioteca oficial de componentes do painel.

## Liquid Glass — fonte exportada

Referência adicional fornecida pelo usuário: `Painel VIVOX Liquid Glass.html`, na raiz do projeto. O bloco de material começa na linha 1708; o comportamento de reflexo e refração aparece no script a partir da linha 3200. Esse arquivo passa a ser a referência precisa dos efeitos, além das cores e fontes já inspecionadas no painel público.

- Cena atrás do vidro: dois gradientes radiais dourados sobre um gradiente marfim de 165 graus.
- Vidro dos controles: branco com opacidade 0,26; hover 0,40; brilho vertical em três pontos; blur de 3px, saturação de 170% e brilho de 1,04.
- Painéis de leitura: branco quente com opacidade 0,62, blur de 26px, saturação de 160% e raio de 26px.
- Profundidade: quatro sombras internas, sombra externa em duas camadas e borda especular mascarada com gradiente de 150 graus.
- Reflexo: luz radial acompanha a posição do ponteiro, com fade de 0,45s; as camadas decorativas não recebem eventos de clique.
- Refração no Chromium: mapa de lente gerado em canvas, deslocamento nas bordas e escalas ligeiramente diferentes nos canais vermelho, verde e azul. O arquivo original limita a resolução do mapa a 420px.
- Modais: vidro leitoso com opacidade 0,92, blur de 30px, saturação de 180% e raio de 28px.

Os valores exportados também estão em `vivox-painel-tokens.json`. A adaptação para React precisa limitar os efeitos à tela de planejamento e liberar observadores, filtros e eventos ao desmontar. O fallback mantém transparência, blur e bordas nos navegadores sem refração SVG; preferências de acessibilidade reduzem animação e transparência.
