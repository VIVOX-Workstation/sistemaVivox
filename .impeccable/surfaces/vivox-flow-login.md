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
