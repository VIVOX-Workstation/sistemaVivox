# Superfície: página inicial VIVOX Flow

## Propósito e acesso
- Apresentação pública da plataforma interna da equipe VIVOX, em uma única tela de composição centrada.
- A rota `/` exibe esta superfície para não autenticados; o único CTA principal, **Entrar**, leva a `/login`.
- Rotas e permissões existentes são preservadas: internos autenticados seguem o painel; contas CLIENTE seguem `/portal`.
- A página não enumera ferramentas ou módulos, cita VVOX Sync nem mostra telas ou demonstrações da plataforma.
- Usa conteúdo local, atualiza o título do documento e não introduz chamadas de API.

## Identidade e composição
- Nome **VIVOX Flow**, centralizado no topo, com logo VIVOX original antes do texto Flow.
- Preservar `vivox-clientes/public/brand/vivox-logo.svg`, exibido por `/brand/vivox-logo.svg`.
- Fundo preto quente (`#11100e`), texto creme (`#f6f0e7`) e destaque dourado (`#c7a15f`).
- Título **O próximo passo começa no Flow.** em Archivo local, escala principal de 48–96 px; corpo breve em Manrope local.
- Fontes servidas por `/fonts/archivo.woff2` e `/fonts/manrope.woff2`; rodapé discreto.
- CTA creme arredondado, seta em círculo escuro e brilho dourado ao passar o ponteiro.
- `FlowingPaths.tsx` adapta Background Paths do Kokonut UI, publicado no 21st.dev, com 18 curvas SVG douradas e Motion.
- Origem: https://github.com/kokonut-labs/kokonutui/blob/main/components/kokonutui/background-paths.tsx; licença MIT preservada em `FlowingPaths.LICENSE.txt` adjacente.
- Movimento contínuo de posição vertical, opacidade e `pathOffset`; máscara central preserva a leitura do texto.

## Responsividade e acessibilidade
- Altura mínima de `100svh`, margens fluidas; até 700 px, título de 42–58 px e corpo de 14 px; até 360 px, título de 36 px.
- Link **Pular para o conteúdo**, título semântico, foco dourado visível e logo com texto alternativo VIVOX.
- Arte e seta são decorativas; animação para fora da área visível, em aba oculta ou com movimento reduzido, reagindo a mudanças da preferência.
- CSS também remove animações e transições sob `prefers-reduced-motion: reduce`.

## Escopo
- Expansão localizada baseada nos arquivos da home, componente de curvas, `PRODUCT.md` e rotas de `src/App.tsx`.
- `DESIGN.md` e `.impeccable/design.json` continuam como referências exclusivas do Kanban VVOX Sync.

## Controles compartilhados da home e login
- `FlowNavigation` usa Radix Dropdown Menu em um controle compacto à direita, preservando a marca central; destinos reais: **Página inicial** (`/`) e **Acessar conta** (`/login`), com item atual marcado.
- Foco gerenciado; setas, Home/End e Enter operam o menu, Escape devolve foco ao acionador, clique fora fecha e colisões com o viewport são tratadas.
- Inspiração visual: menus Kokonut UI encontrados no 21st.dev; código próprio, sem adaptação integral do componente de referência.
- O CTA compartilhado usa `utils/flowButtonEffects.ts`: luz acompanha o cursor, deslocamento limitado a 3 px por eixo apenas com mouse, brilho no hover e seta dourada.
- Foco, estado desabilitado e movimento reduzido são preservados; controles restritos à home/login, sem suporte, Google, administrador ou módulos, sem alterar o painel interno.
