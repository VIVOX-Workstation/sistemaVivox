# Superfície: página inicial Flow VIVOX

## Propósito e acesso
- Apresentação pública da plataforma interna da equipe VIVOX, em uma única tela de composição centrada.
- A rota `/` exibe esta superfície para não autenticados; o único CTA principal, **Entrar**, leva a `/login`.
- Rotas e permissões existentes são preservadas: internos autenticados seguem o painel; contas CLIENTE seguem `/portal`.
- A página não enumera ferramentas, cita VVOX Sync nem mostra telas ou demonstrações da plataforma.
- `FlowHome.tsx` usa conteúdo local, atualiza o título do documento e não introduz chamadas de API.

## Identidade e composição
- Fundo preto quente (`#11100e`), texto creme (`#f6f0e7`) e destaque dourado (`#c7a15f`).
- Preservar o logo original `vivox-clientes/public/brand/vivox-logo.svg`, exibido por `/brand/vivox-logo.svg`.
- Título **O próximo passo começa no Flow.** em Archivo local, com escala principal de 48–96 px e Flow em dourado.
- Texto breve e neutro em Manrope local; fontes servidas por `/fonts/archivo.woff2` e `/fonts/manrope.woff2`.
- Entrada em botão creme arredondado, com seta em círculo escuro; cabeçalho e rodapé discretos enquadram o conteúdo.
- Geometria abstrata de três curvas Bézier douradas, com um traço sobreposto animado por dois segundos.

## Responsividade e acessibilidade
- Altura mínima de `100svh`, margens fluidas e conteúdo centralizado; a arte permanece decorativa e não recebe interação.
- Até 700 px, título de 42–58 px, corpo de 14 px e arte ampliada; até 360 px, título de 36 px e marca compactada.
- Link **Pular para o conteúdo**, título principal semântico, foco dourado visível e logo com texto alternativo VIVOX.
- Arte e seta decorativas são ocultadas de tecnologias assistivas; `prefers-reduced-motion: reduce` remove animações e transições.

## Escopo
- Expansão localizada, baseada em `PRODUCT.md`, `FlowHome.tsx`, `FlowHome.css` e nas rotas de `src/App.tsx`.
- `DESIGN.md` e `.impeccable/design.json` continuam como referências exclusivas do Kanban VVOX Sync.
