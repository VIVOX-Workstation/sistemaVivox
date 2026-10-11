# Superfície: página inicial Flow VIVOX

## Propósito e acesso
- Apresentar a plataforma interna da equipe VIVOX, que reúne clientes, demandas, acompanhamento e resultados.
- A rota `/` exibe esta página para visitantes não autenticados; o botão **Entrar** encaminha para `/login`.
- Usuários internos autenticados seguem o painel e as permissões existentes; contas CLIENTE seguem para `/portal`.
- A superfície funciona como apresentação da plataforma, com uma demonstração estática identificada como **Exemplo de fluxo**.
- As tarefas e etapas da demonstração são ilustrativas; não representam dados reais nem funcionalidades interativas do quadro.
- `FlowHome.tsx` não introduz chamadas de API; usa conteúdo local e atualiza o título do documento.

## Identidade implementada
- Hero escuro (`#11100e`), superfície de papel (`#faf9f6`) e destaque dourado (`#c7a15f`).
- Archivo nos títulos e na palavra Flow; Manrope no corpo, carregadas localmente de `/fonts/archivo.woff2` e `/fonts/manrope.woff2`.
- Preservar o logo original `vivox-clientes/public/brand/vivox-logo.svg`, exibido por `/brand/vivox-logo.svg` sem alteração de desenho.
- Composição: cabeçalho de marca, hero com entrada e demonstração, visão das quatro áreas e rodapé da equipe.
- A demonstração tem fundo branco, cartões claros, cantos arredondados e rotação discreta no desktop.
- Os cabeçalhos das etapas usam branco sobre cinza (`#68686e`), azul (`#1769c5`) e verde (`#087d3d`), com os contrastes corrigidos.

## Layout e acessibilidade
- Contêiner limitado a 1280 px; hero em duas colunas no desktop e uma coluna até 820 px.
- As quatro áreas passam a duas colunas até 820 px; até 480 px, apresentação e rodapé são compactados e a rotação estática do quadro é removida.
- A demonstração mantém suas três etapas lado a lado, com espaçamentos e tipografia ajustados às larguras menores.
- Inclui link **Pular para o conteúdo**, títulos hierárquicos, identificação das seções e foco visível dourado.
- Ícones decorativos são ocultados de tecnologias assistivas; o logo mantém texto alternativo VIVOX.
- `prefers-reduced-motion: reduce` desativa animações e transições da superfície.

## Escopo e fontes
- Expansão localizada: estas decisões documentam somente a página inicial Flow VIVOX.
- `DESIGN.md` e `.impeccable/design.json` continuam sendo referências exclusivas do Kanban VVOX Sync.
- Fontes observadas: `PRODUCT.md`, `vivox-clientes/src/pages/FlowHome.tsx`, `FlowHome.css` e `vivox-clientes/src/App.tsx`.
