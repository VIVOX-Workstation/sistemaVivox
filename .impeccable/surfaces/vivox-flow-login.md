# Superfície: login VIVOX Flow

## Propósito e comportamento
- A rota `/login` permite entrar na plataforma usando e-mail e senha.
- `LoginVivox.tsx` apresenta o formulário; `pages/Login.tsx` preserva `POST /auth/login`, `signIn`, sessão e destinos por função.
- Contas CLIENTE seguem `/portal`; usuários internos seguem `/`, com a flag de introdução existente.
- O checkbox **Lembrar de mim** permanece no contrato do formulário, sem atribuir a ele persistência adicional na autenticação.
- Foram removidos **Suporte**, **Continuar com Google**, **Falar com o administrador**, callbacks correspondentes e links fictícios.

## Composição e identidade
- Marca **VIVOX Flow** centralizada no topo, com o logo original `/brand/vivox-logo.svg` antes de Flow.
- Formulário centralizado, sem card envolvente, limitado a 400 px; título **Bem-vindo de volta.** e texto breve.
- Campos de 56 px, borda acessível (`#756856`), cantos de 12 px e fundo (`#181612`).
- Compartilha Archivo/Manrope locais, preto quente (`#11100e`), creme (`#f6f0e7`) e dourado (`#c7a15f`) com a home.
- Botão **Entrar** ocupa a largura do formulário; marca e link **Voltar à página inicial** levam a `/`.
- Referência de composição: Minimal Auth Page de Efferd no 21st.dev; implementação própria, sem copiar o código da referência.
- Fundo decorativo usa o `FlowingPaths` compartilhado, com máscara central e opacidade reduzida para proteger a leitura.

## Estados, acessibilidade e responsividade
- Labels associados, autocomplete de credenciais, validação nativa, link para pular conteúdo e foco visível.
- Controle **Mostrar/Ocultar senha** com nome acessível e `aria-pressed`; ícones são decorativos.
- Loading marca o formulário como ocupado, bloqueia campos e controles e mostra **Entrando…** com indicador visual.
- Erro em `role=alert`, associado aos campos; ao finalizar a tentativa, os controles permitem corrigir dados e tentar novamente.
- Layout fluido; até 700 px, formulário limitado a 380 px e espaçamentos ajustados; movimento reduzido desativa animações e transições.

## Verificação e escopo
- QA informado: quatro viewports e resposta 401 controlada aprovados; login com credenciais reais não foi testado.
- Esta documentação cobre somente o login; regras globais do Kanban em `DESIGN.md` e `.impeccable/design.json` permanecem próprias daquela superfície.

## Controles compartilhados da home e login
- `FlowNavigation` usa Radix Dropdown Menu à direita, mantendo a marca central: acionador Grid2X2 fechado e X aberto; destinos **Página inicial** (`/`) e **Acessar conta** (`/login`), com item atual marcado.
- Foco gerenciado; setas, Home/End e Enter operam o menu, Escape devolve foco ao acionador, clique fora fecha e colisões com o viewport são tratadas.
- Inspiração visual: menus Kokonut UI encontrados no 21st.dev; código próprio, sem adaptação integral do componente de referência.
- O CTA metálico compartilhado tem cantos de 19 px, gradiente direcional, sombras com offset e relevo; `utils/flowButtonEffects.ts` controla reflexo e deslocamento do cursor de até 3 px por eixo, apenas com mouse, com brilho no hover, pressão e seta clara em bloco escuro de cantos de 12 px.
- Foco, estado desabilitado e movimento reduzido são preservados; controles restritos à home/login, sem suporte, Google, administrador ou módulos, sem alterar o painel interno.
- Menu em painel quente translúcido com blur local de 18 px, itens de altura mínima de 90 px e ícones em blocos de 46 px (40 px até 360 px).
- Referência visual do CTA: [Liquid Metal Button no 21st.dev](https://preview.21st.dev/@johuniq/components/liquid-metal-button); implementação CSS própria, sem shader ou componente liquid-metal de terceiros instalado.
- QA informado desta iteração: quatro viewports e teclado aprovados; build, lint e detector aprovados.
