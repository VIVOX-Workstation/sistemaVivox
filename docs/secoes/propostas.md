# Propostas

## Para que serve

Propostas comerciais por cliente, editáveis por seções, com um link exclusivo
para o destinatário ler sem login.

## Onde fica

| Parte | Caminho |
|---|---|
| Rotas | `/cliente/:id?tab=propostas` (equipe), `/proposta/:token` (público) |
| Telas | `vivox-clientes/src/features/propostas/` |
| Backend | `backend/src/propostas/` |
| Prévia no WhatsApp | `vivox-clientes/nginx.conf` (Open Graph em `/proposta/:token`) |

## Dados

`Proposta` (título, destinatário, apresentação, validade, cor, `demo` opcional, `formato` documento|pdf, arquivo do PDF, `criadoPorId`, `secoes` em JSON
com Markdown ou HTML sanitizado, `linkHash`, `linkTokenCriptografado`).
Endpoints `/clientes/:id/propostas[/:pid[/compartilhar]]`, `POST .../propostas/pdf`, `PATCH .../:pid/pdf`, `GET .../:pid/arquivo`, `GET /propostas-publicas/:token[/arquivo]`.

Três jeitos de criar: em branco, pelo modelo de ensino ou **enviando um PDF pronto**. A proposta em PDF guarda o arquivo no storage e o link público mostra o PDF página a página à esquerda e, à direita, uma barra com título, destinatário, mensagem, histórico (enviada, atualizada, validade), páginas, tamanho e o botão de baixar; no celular essa barra vira gaveta aberta pelo botão de menu.

Com `demo` preenchido (hoje só `ensino`), o link público abre em duas abas: a proposta em formato de landing page e uma demo navegável da plataforma com dados fictícios (telas exportadas em `vivox-clientes/public/demos/<demo>/<Tela>.dc.html`, ligadas pelos próprios links, com troca Portal do aluno | Painel administrativo).

## Quem acessa

Módulo **CLIENTES** (ADMIN e COLABORADOR). O link público não exige sessão.

## Como funciona

As regras detalhadas (capa, subcapa, PDF, HTML seguro, links recuperáveis,
revogação) estão em [`MEMORIA_DO_SISTEMA.md › 5`](../MEMORIA_DO_SISTEMA.md#propostas-comerciais).

## Conversa com

- **Clientes:** pertence ao cliente; o destinatário é do documento e não altera o cadastro.
- Nenhuma outra seção hoje (não vira contrato nem serviço).

## Pendências e cuidados

- Sem aceite/assinatura nem conversão em contrato.
- Rotacionar `JWT_SECRET` exige gerar novos links para recuperá-los.

## Registro de mudanças

- 2026-10-24 · `feat/proposta-pdf` · Proposta em PDF: botão "Enviar PDF" na aba Propostas, formulário com arrastar e soltar, prévia da 1ª página e ficha de criação (quando, quem, arquivo, tamanho, páginas); lista com selo PDF, destinatário e "criada por"; link público com o PDF à esquerda (pdf.js) e barra de dados e histórico à direita, gaveta no celular · migration `20261024120000_proposta_pdf`, `SalvarPropostaPdfDto`, `PropostasService` (criarPdf/editarPdf/arquivo/arquivoPublico), `PropostaPdfForm`, `PropostaPdfPublica`, `PdfPaginas`, `proposta-pdf.css`, `nginx.conf` (.mjs) · aplicar a migration no deploy; `npm install` (pdfjs-dist); conferir no deploy que o worker `.mjs` sai como JavaScript.
- 2026-10-23 · `style/proposta-mobile` · Proposta e demo no celular: abaixo de 768px o hero troca o parallax 3D por duas faixas de prints que deslizam (`hero-parallax.tsx`); números, etapas e valores da landing compactos; login do aluno só com o formulário (a faixa da marca some no celular); topo das telas do aluno em duas linhas e botões do destaque do Início na mesma linha; painel com a leftbar em gaveta e botão de menu (`menu-admin.js`/`.css`, o tour abre a gaveta no passo do menu); meta viewport em todas as telas da demo; rótulos do saldo em Recompensas legíveis no tema escuro; passo "Pontos do aluno" do tour aponta para o selo de pontos · `landing.css`, `public/demos/ensino/*.dc.html`, `tour.js` · —

- 2026-10-23 · `feat/demo-tour-guiado` · Tour guiado na demo de ensino com Driver.js 1.3.6 (`public/demos/lib/`): `public/demos/ensino/tour.js` tem os passos de cada tela e leva da entrada do aluno ao painel da equipe; começa sozinho na primeira visita e o botão "Tour guiado" na barra da demo recomeça · `tour.js`, `tour.css`, `PropostaPublica` · andamento do tour em `sessionStorage` (só estado da visita); trocar um rótulo ou `aria-label` das telas pode tirar o destaque de um passo.
- 2026-10-23 · `feat/proposta-demo-ensino` · Link público em 2 abas quando a proposta tem `demo`: aba Proposta como landing escura (ref. memberclass/pandavideo), com o HTML das seções lido em blocos (`landingBlocos.ts`), hero em parallax com prints da demo (`components/ui/hero-parallax.tsx`, `framer-motion`) e prints reais nas seções do painel e do portal; aba Demo com as 12 telas da "Academia Visão" navegáveis (leftbar, cards e botões), troca aluno/painel, tema escuro/claro e vídeos do canal do Hospital Visão; modelo de ensino com uma modalidade ("Vídeo integrado", R$ 4.900 + R$ 690/mês, 30 a 45 dias); logo VIVOX (`components/brand/VivoxLogo.tsx`) no header e no rodapé · migration `20261022120000_proposta_demo`, `SalvarPropostaDto.demo`, `PropostaLanding`, `landing.css`, `public/demos/ensino/` (telas, `prints/`, `img/`), select "Demo interativa" no editor · aplicar a migration no deploy; `npm install` por causa do `framer-motion`; HTML fora do modelo aparece como texto corrido; a demo e os prints são do Hospital Visão, então outra proposta com `demo: "ensino"` mostra essa mesma marca.
- 2026-10-20 · `fix/excluir-proposta-listagem` · Excluir pela listagem; consultar o link ativo sem renovar; token criptografado; prévia Open Graph · `PropostasService`, migration `20261020120000_proposta_link_recuperavel`, `PropostasTab`, `vivox-clientes/nginx.conf` · conferir prévia no WhatsApp após deploy.
- 2026-10-19 · `feat/propostas-clientes` · Criação: modelo de ensino, edição por seções, capa/subcapa/encerramento, rolagem contínua, PDF, link público revogável, paleta dourada · `features/propostas`, `backend/src/propostas` · —
