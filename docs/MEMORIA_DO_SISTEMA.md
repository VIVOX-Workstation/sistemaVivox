# Memória do Sistema VIVOX

> Fonte de contexto para quem vai mexer no projeto: pessoa ou IA.
> Validado contra o código da `main` em **2026-10-16** (commit `38b1d16`).
> Ao revalidar, troque a data e o commit. Ao terminar uma mudança, adicione uma
> linha em [Registro de mudanças](#9-registro-de-mudanças).

**Regra de ouro:** se algo aqui contradiz o código, o código vence. Corrija este
arquivo no mesmo PR.

Documentos que estavam como fonte de contexto e **ficaram desatualizados**
(validados em 2026-08-18): `docs/CONTEXT.md`, `docs/ARCHITECTURE.md`,
`docs/TASKS.md`. Eles dizem, por exemplo, que GP, Educacional e Instagram não
existem. Use-os só como histórico de decisões de segurança e migração.

---

## 1. O sistema em uma página

Sistema interno da agência VIVOX para clientes, serviços, produção de conteúdo,
tarefas, suporte, hospedagens, métricas, treinamento e um portal para o cliente.

| Parte | Onde | Tecnologia |
|---|---|---|
| API | `backend/` | NestJS 11, Prisma 5, PostgreSQL 16 + pgvector |
| Front da equipe e do portal | `vivox-clientes/` | React 19, Vite, Tailwind 4, React Router 7, axios |
| VVOX Sync (quadro de tarefas) | `vivox-clientes/public/kanban/` | HTML + JS sem framework, aberto em iframe por `features/kanban/KanbanPage.tsx` |
| Arquivos | MinIO (S3) | `StorageService`; URL pública via `S3_PUBLIC_URL` |
| IA | `backend/src/ia` | Groq (chat), OpenAI (embeddings), Tavily (pesquisa) |
| Integrações | `backend/src/analytics`, `devboard`, `github` | GA4 + Search Console (service account), OpenPanel, Meta/Instagram (OAuth), GitHub App |
| Deploy | `docker-compose.prod.yml`, Coolify | Ver `docs/coolify-production.md` |

Repositório do time: `github.com/VIVOX-Workstation/sistemaVIVOX`. Existe também o
fork `kelson-cosme/sistemaVivox`; confirme o remoto antes de qualquer push.

Rodar local: `README.md` (Docker) ou `VVOX_SYNC.md` (`npm run dev:sync`, portas
3001/5174). O `VVOX_SYNC.md` cita caminhos da máquina de outra pessoa
(`C:\Users\pfeihmartins\...`); ajuste para o seu checkout.

---

## 2. Papéis e permissões (como funciona de verdade)

### Papéis

- `ADMIN`: acessa tudo, inclusive Configurações e Gerenciar cursos.
- `COLABORADOR`: acessa os módulos da lista `User.modulos`.
- `CLIENTE`: só o portal. Cada cliente tem no máximo um usuário (`User.clienteId`, único).

**Atenção:** usuário novo recebe **os 7 módulos por padrão** (default do campo no
Prisma). Liberar é o padrão; o administrador **tira** módulos em
Configurações › Equipe › Permissões.

Módulos (`enum ModuloSistema`): `DASHBOARD`, `CLIENTES`, `HOSPEDAGENS`,
`ANALYTICS`, `ACOMPANHAMENTO`, `GP`, `EDUCACIONAL`.

### No front (`vivox-clientes/src/App.tsx`)

| Proteção | Faz |
|---|---|
| `InternalRoute` | Sem sessão → `/login`. `CLIENTE` → `/portal` |
| `PortalRoute` e similares | Sem sessão → `/portal/entrar?destino=…`. Não cliente → `/` |
| `ModuloRoute modulo="X"` | Sem o módulo → primeira rota liberada (`MODULOS[].rotaInicial`) ou `/sem-acesso` |
| `AdminRoute` | Gerenciar cursos; não admin → `/educacional` |
| `ConfiguracoesRoute` | Não admin → primeira rota liberada |
| `podeAcessar()` (`AuthContext`) | ADMIN sempre; sessão antiga sem `modulos` libera até `/auth/me` responder |

O front é só conveniência. **Quem decide é o backend.**

### No backend

- `JwtAuthGuard` (`auth/jwt-auth.guard.ts`) faz três coisas: valida o JWT,
  bloqueia `CLIENTE` em qualquer rota sem `@PortalCliente()`/`@Roles(CLIENTE)`,
  e aplica `@RequerModulo({ todos, leitura })` lendo os módulos **do banco** a
  cada chamada.
- `todos`: ter **qualquer um** desses módulos libera leitura e escrita.
  `leitura`: ter um desses libera **só GET**.
- `RolesGuard` + `@Roles(...)`: restrição por papel.

| Controller | `@RequerModulo` todos | Só leitura também para |
|---|---|---|
| `clientes` | CLIENTES | GP, ANALYTICS, ACOMPANHAMENTO |
| `servicos`, `producoes`, `midias`, `planejamento-servico`, `devboard` | CLIENTES | — |
| `hospedagens` | HOSPEDAGENS, CLIENTES | — |
| `analytics` (inclui `dashboard-executivo`) | ANALYTICS, CLIENTES | DASHBOARD |
| `acompanhamento` | ACOMPANHAMENTO | — |
| `tarefas` | GP | CLIENTES |
| `projetos`, `kanban`, `quadros` | GP | — |
| `chamados` | GP, CLIENTES | — |
| `educacional` | EDUCACIONAL | — |
| `cursos` | EDUCACIONAL + `@Roles('ADMIN')` | — |
| `portal` | `@Roles(CLIENTE)` | — |
| `ia` | sem módulo (qualquer usuário interno logado) | — |
| `users` | Listar: qualquer interno; criar/papel/módulos/excluir: ADMIN; editar: ADMIN ou a própria conta | — |

Ao criar um controller novo: `@UseGuards(JwtAuthGuard)` + `@RequerModulo(...)`.
Não existe guard global.

---

## 3. Mapa de telas → dados

Rotas reais do front e o que cada uma consome. O detalhe campo a campo está em
[`CRUZAMENTO_TELAS_DADOS.md`](CRUZAMENTO_TELAS_DADOS.md).

| Rota | Página | Endpoints principais |
|---|---|---|
| `/login` | `pages/Login.tsx` + `components/LoginVivox.tsx` | `POST /auth/login`, `POST /auth/esqueci-senha` (**não existe no backend**) |
| `/portal/entrar` | `PortalLogin.tsx` | `POST /auth/login` |
| `/` | `MainDashboard.tsx` + `components/dashboard/*` | `GET /analytics/dashboard-executivo` |
| `/clientes` | `ClientList.tsx` | `GET /clientes` |
| `/cliente/novo` | `ClientForm.tsx` | `POST /clientes` |
| `/cliente/:id` | `ClientProfile.tsx` (abas Visão geral, Mapa de serviços, Anotações) | `GET/PATCH /clientes/:id`, uploads de logo/banner, `/servicos/cliente/:id`, `/hospedagens/cliente/:id`, `/tarefas`, `/clientes/:id/acesso-portal`, `/chamados` |
| `/cliente/:id/servicos/:sid/planejamento[/:itemId]` | `PlanejamentoServico.tsx` | `/planejamento-servico/servico/:sid`, `/servicos/:sid`, `/hospedagens`, `/ia/chat`, `/tarefas` |
| `/cliente/:id/servicos/:sid/devboard` | `DevBoard.tsx` (só serviço `APP`) | `/devboard/*`, `/devboard/servico/:sid/github/*` |
| `/hospedagens`, `/renovacoes` | `HostingRadar.tsx` | `GET /hospedagens/radar` |
| `/analytics` | `AnalyticsIndex.tsx` | `GET /clientes`, `GET /analytics/sparklines` |
| `/analytics/:id` | `AnalyticsDashboard.tsx` (abas Site e Instagram) | `/analytics/openpanel/:id`, `/analytics/instagram/*` |
| `/acompanhamento[/:clienteId]` | `Acompanhamento.tsx` (abas Publicações, Cronogramas) | `/acompanhamento/*` |
| `/vvoxsync[/:quadro[/tarefa/:id]]`, `/gp`, `/gp/tarefa/:id` | `features/kanban/*` (iframe) | `/kanban/*`, `/tarefas/*`, `/users` |
| `/gp/minhas-tarefas`, `/gp/workspace/:id` | `VivoxGP.tsx` (Kanban legado, Lista, Prazos, Chamados) | `/projetos`, `/tarefas/*`, `/chamados/*` |
| `/educacional`, `/educacional/curso/:id` | `EducacionalHome.tsx`, `EducacionalCurso.tsx` | `/educacional/*` |
| `/educacional/admin[/:cursoId]` | `EducacionalAdmin.tsx`, `EducacionalCursoEditor.tsx` | `/cursos/*` |
| `/configuracoes` | `Configuracoes.tsx` (Equipe, Novo usuário, Minha conta, Aparência) | `/users/*` |
| `/portal`, `/portal/acompanhamento`, `/portal/cronogramas` | `PortalCliente.tsx`, `PortalAcompanhamento.tsx`, `PortalCronogramas.tsx` | `/portal/*` |
| global | `FloatingAssistant.tsx` | `/ia/chat`, `/ia/productions/create-from-ai` |

---

## 4. Modelo de dados: onde cada coisa mora

Schema: `backend/prisma/schema.prisma` (38 models). Os que mais aparecem na interface:

| Assunto | Model | Observação |
|---|---|---|
| Cliente | `Cliente` | `contatos` é JSON; `loginsSenhas` é texto livre; tokens da Meta ficam aqui |
| Usuário | `User` | `modulos[]`, `clienteId` (portal), `senhaPortalCriptografada` (AES, para reexibir a senha do portal) |
| Serviço contratado | `ServicoContratado` (+ `ServicoHistorico`) | `tipoServico`: GERENCIAMENTO_REDES, FOLDER, REVISTA, LANDING_PAGE, APP, FOTOGRAFIA, VIDEO, TRAFEGO_PAGO, IDENTIDADE_VISUAL |
| Planejamento | `PlanejamentoServico` | **Os itens/entregas ficam no JSON `flowNodes`** (ver armadilhas) |
| Hospedagem | `AtivoHospedagem` | Domínio, VPS, SSL (booleano), ciclo, custo e valor cobrado |
| Tarefas | `Tarefa`, `TarefaChecklist`, `TarefaComentario`, `TarefaSessao` | Servem ao GP **e** ao VVOX Sync |
| Workspaces do GP | `Projeto` | Na interface o nome é "workspace" |
| Quadros do Sync | `KanbanQuadro`, `KanbanColuna` | Colunas com `papel` (fila, revisão…) e `planoPublicacao` |
| Chamados | `Chamado`, `ChamadoComentario` | SLA calculado pela urgência; cria uma `Tarefa` junto |
| Publicações | `Publicacao` | Planilha do Acompanhamento; `compartilhamentos` = "Envios" |
| Cronogramas | `CronogramaCliente` | PDF no MinIO |
| Portal | `InteresseServico` | Um por cliente e tipo de serviço |
| Métricas | `AnalyticsSnapshot`, `InstagramFollowerSnapshot` | GA4/GSC/OpenPanel são lidos ao vivo, com cache em memória |
| DevBoard | `DevBoardCard` | Ligado ao serviço e ao repositório do GitHub App |
| Educacional | `Curso`, `Modulo`, `Aula`, `AulaProgresso` | `publicado` controla a exibição |
| Segundo cérebro | `FonteContexto`, `DocumentoVetorial`, `InteligenciaMercado` | RAG por cliente; telas ligadas estão órfãs (ver 5.3) |
| Quadro branco | `QuadroSala` | Excalidraw colaborativo |

Migrações: `backend/prisma/migrations/` (31 até hoje). Sempre gere migration
(`prisma migrate dev`); produção usa `prisma migrate deploy` no boot.

---

## 5. Armadilhas conhecidas (leia antes de mudar algo)

### 5.1 Comportamento que confunde

1. **Itens do planejamento moram em `PlanejamentoServico.flowNodes`.** O nome
   vem do antigo fluxograma. Cada item é um `ItemPlanejado` (tipo em
   `pages/PlanejamentoServico.tsx`): título, status, prazo, público, oferta,
   referências, `estrutura[]` (seções com texto e CTA), `etapas[]`, `tarefaIds[]`,
   `linkFinal`. Há cópia em `localStorage` (`@Vivox:itensPlanejados:<servicoId>`)
   usada como reserva. `Chamado.itemPlanejadoId` e `AtivoHospedagem.itemPlanejadoId`
   apontam para o `id` dentro desse JSON, não para uma tabela.
2. **Dois quadros de tarefas usam a mesma tabela `Tarefa`.** O VVOX Sync usa
   `quadroId` + `colunaId`; o GP legado (`VivoxGP.tsx`) usa `status` (texto livre:
   `A_FAZER`, `EM_ANDAMENTO`…) e `projetoId`. `Tarefa.status` é `String`, não enum.
3. **Colunas do Kanban legado do GP ficam no `localStorage`** de cada navegador
   (`KanbanBoard.tsx`, `getKanbanStorageKey`). Duas pessoas podem ver colunas diferentes.
4. **O VVOX Sync não é React.** É HTML/JS em `public/kanban/`, com CSS copiado
   byte a byte do pacote original. Regras visuais e de integração: `DESIGN.md` e
   `VVOX_SYNC.md`. Não reescreva em JSX sem decisão registrada.
5. **Criar chamado cria uma tarefa** (`chamados.service.ts`), com tag `chamado` e
   título prefixado por emoji.
6. **Só ADMIN altera prazo de tarefa** (`tarefas.service.ts`).
7. **A aba "Site" do Analytics mostra dados de exemplo** com o selo "Modo
   demonstrativo" quando o OpenPanel não responde (`ClientPerformanceDashboard.tsx`).
8. **GA4 e Search Console estão prontos no backend, mas não aparecem na
   interface.** `GoogleAnalyticsDashboard.tsx` existe e não é usado; a aba Site
   mostra só o OpenPanel.
9. **Validação do backend descarta campos não declarados** (`ValidationPipe`
   com `whitelist: true`, sem erro). Campo novo precisa entrar no DTO, senão some
   em silêncio.

### 5.2 Defeitos encontrados em 2026-10-16 (confirmados lendo o código, ainda não testados em execução)

| # | Onde | O que acontece | Correção sugerida |
|---|---|---|---|
| D1 | `Login.tsx` → `POST /auth/esqueci-senha` | A rota não existe no `AuthController`. O pedido de nova senha falha (404) | Criar a rota (gravar pedido/notificar) ou trocar a tela por instrução de contato |
| D2 | Perfil › Editar cadastro → `PATCH /clientes/:id` com `ga4PropertyId` | **Descartado em 2026-10-16: não é defeito.** O campo está no `CreateClienteDto` e é salvo. Ganhou teste de regressão na branch `fix/senha-esqueci-ga4` | — |
| D3 | Configurações › Redefinir senha e Minha conta → `PATCH /users/:id` com `senha` | `UsersService.update` grava a senha **sem bcrypt**; o login seguinte falha porque `bcrypt.compare` não reconhece | Criptografar no `update` (ou rota própria de senha) e nunca devolver `senha` na resposta |
| D4 | `POST /users` | Devolve o usuário criado com o hash da senha | `select`/`omit` de `senha` |
| D5 | `GET /clientes/:id` | Devolve `metaAccessToken` e `loginsSenhas` para qualquer interno com leitura | Omitir o token; decidir quem vê `loginsSenhas` |
| D6 | `Configuracoes.tsx` | Não chama `DELETE /users/:id` (a rota existe) | Decidir se a interface deve excluir usuários |

### 5.3 Código sem uso no front

Nenhum outro arquivo importa estes componentes: `AiContentStudioTab`,
`ExecutiveReportTab`, `MarketTab`, `PlanningTab`, `HostingTab`,
`GoogleAnalyticsDashboard`, `GanttChart`, `DependencyFlow`, `WorkspaceSidebar`,
`components/ui/demo`, `components/ui/sidebar-component` (exemplo em inglês).
Antes de recriar algo parecido, veja se dá para reaproveitar; antes de apagar,
confirme com o responsável (vários são de funções planejadas: segundo cérebro,
relatório executivo, mercado).

### 5.4 Débitos antigos ainda abertos

- Credenciais que vazaram no histórico do Git em agosto (TASK-001/014 em `docs/TASKS.md`): rotação depende de um humano.
- Redis está no Docker mas não é usado (TASK-008).
- `vivox-tokens.css` duplicado (TASK-006).
- Três fontes de design diferentes: a ordem de uso está em `docs/DESIGN_SYSTEM.md`.

---

## 6. Linha do tempo de construção

Resumo do `git log` (190 commits até `38b1d16`).

| Período | O que entrou |
|---|---|
| 05–16/08/2026 | Primeiro commit. Clientes, serviços, planejamento com fluxograma + Gantt, hospedagens, analytics Google, IA. Deploy no Coolify (Docker, MinIO) |
| 17–18/08 | Componentes visuais, configurações, mapa de serviços. Limpeza de segredos versionados, guards no `IaController` e `seed-admin`, CORS restrito, migrations regularizadas. Docs de contexto (`docs/CONTEXT.md` etc.) |
| 22–23/08 | **Vivox GP**: workspaces, Kanban estilo Bitrix24, deep links, chat com anexos. Redesign do perfil do cliente. Tentativa de Penpot (vários commits). Central de chamados |
| 25/08 | **Vivox Educacional**. Chamados com formulário completo e SLA automático. Agents do projeto (`.claude/agents`) e skill `create-pr` |
| 31/08 | Penpot trocado por **Excalidraw** colaborativo (`QuadroSala`). Subdomínios HTTPS em produção |
| 14/09 | GP: observadores, Kanban otimizado; backup/importação de tarefas por workspace |
| 15–17/09 | **OAuth Meta** (Instagram/Facebook) e login direto do Instagram; histórico de seguidores. **DevBoard** com GitHub App |
| 22/09 | Correção do método de autenticação da Meta + teste |
| 01/10 | Dados do dashboard geral, sparklines, prazo de hospedagem. **Redesign liquid glass** (dashboard, hospedagens, analytics, cliente, planejamento, lista de clientes, configurações) |
| 02/10 | **Portal do cliente** (papel `CLIENTE`, mapa de serviços, "tenho interesse", login próprio) |
| 06/10 | **Permissões por módulo** (`User.modulos`, `@RequerModulo`, menu filtrado, Configurações só para ADMIN) |
| 08/10 | **Acompanhamento** (planilha mensal de publicações, períodos, compartilhar com cliente, cronogramas em PDF) |
| 10/10 | **VVOX Sync** integrado com dados reais (pacote original em iframe). Exportar/importar backup do Acompanhamento. Bootstrap seguro do banco de produção |
| 11/10 | Aba Projetos removida do GP |
| 14/10 | Nova tela de login preta com luz dourada; menu lateral com a mesma estética; Sync com endereço `/vvoxsync/nome-do-quadro` e pessoas ligadas às contas do sistema |
| 16/10 | Mapeamento completo, protótipo clean no Artifacts, este arquivo, `docs/DESIGN_SYSTEM.md` e `docs/CRUZAMENTO_TELAS_DADOS.md` |

Pessoas no histórico: Kelson Cosme (base do sistema até 08/10), `equipevivox`
e "VIVOX Dev" (Sync, login e menu a partir de 10/10). Trabalho feito com
Claude Code e Codex (branches `codex/…`).

---

## 7. Como pedir mudança a uma IA sem ela inventar

Inclua no pedido:

1. A rota e a página (`/cliente/:id` → `pages/ClientProfile.tsx`).
2. O dado envolvido e de onde ele vem (endpoint + model), ou "precisa de backend".
3. Quem pode ver (papel e módulo).
4. O artboard aprovado no canvas, se for mudança visual.
5. A instrução: "leia `AGENTS.md`, `docs/MEMORIA_DO_SISTEMA.md` e
   `docs/CRUZAMENTO_TELAS_DADOS.md` antes de começar; não crie campo, rota ou
   tela que não esteja no pedido".

A IA deve responder listando o que vai mudar e o que **não** existe no backend
antes de editar.

---

## 8. Checklist antes de abrir PR

- [ ] Li a interface atual e o cruzamento da tela.
- [ ] Todo campo novo existe no Prisma **e** no DTO (por causa do `whitelist`).
- [ ] Rota nova no backend tem `JwtAuthGuard` + `@RequerModulo` ou `@Roles`.
- [ ] Rota nova no front está dentro do `ModuloRoute` certo e o menu usa `podeAcessar`.
- [ ] Nenhum dado de negócio novo no `localStorage`.
- [ ] Migration gerada para mudança de schema.
- [ ] `npm run build` e `npm run lint` passam em `vivox-clientes`; testes do backend passam.
- [ ] Testei como ADMIN, como COLABORADOR com módulos limitados e, se for portal, como CLIENTE.
- [ ] Atualizei este arquivo (seções afetadas + Registro de mudanças).

---

## 9. Registro de mudanças

Uma linha por PR, mais recente no topo. Formato:
`AAAA-MM-DD · branch/PR · o que mudou para quem usa · arquivos ou módulos principais · pendências`.

- 2026-10-19 · `feat/demandas-gerais` · VVOX Sync passa a se chamar Demandas gerais no menu, no título e nas mensagens; endereço novo `/demandasgerais/(nome-do-quadro)`; `/vvoxsync/...` e `/gp` redirecionam para ele · `App.tsx`, `Layout.tsx`, `features/kanban/*`, `public/kanban/index.html`, mensagens em `backend/src/kanban` · nomes internos (código, `VVOX_SYNC.md`, mensagens `vvox-sync:*`) mantidos.
- 2026-10-19 · `feat/kanban-equipe-backend` · VVOX Sync sincronizado com o Quadro de Demandas (Artifact): o administrador muda cargo, função (Proprietário(a)/Supervisor(a)/Responsável/Visualizador(a)) e a matriz de permissões no painel de colaboradores, e isso fica salvo na conta da pessoa; o servidor passa a aplicar a matriz (criar, editar, mover, excluir, aprovar, comentar, quadros e colunas, dias de postagem); foto e nome do perfil, logo do cliente e dias de postagem por cliente saem do navegador e vão para a API · migração `20261019120000_kanban_equipe` (User.cargo/funcaoKanban/fotoUrl + KanbanConfig), `backend/src/kanban/kanban-equipe.*`, `kanban.service.ts`, `public/kanban/js/app.js`, `backend.js` · adicionar e remover pessoas continua em Configurações; "Ver como" segue desligado no sistema.
- 2026-10-16 · `style/layout-clean` · Estrutura base no visual clean: menu lateral branco (recolhe sozinho em tela estreita), atalhos Minhas tarefas e Chamados no menu, barra superior com o nome da tela e o botão "Assistente", assistente IA em painel lateral claro, sem marca d'água e sem a seção "Em breve"; fonte Geist e tokens `--vx-*`; opção "Luz dourada do menu" saiu de Configurações › Aparência · `components/Layout.tsx`, `components/FloatingAssistant.tsx`, `components/brand/VivoxLogo.tsx`, `components/ia/QuickPromptChips.tsx`, `pages/Configuracoes.tsx`, `design-system/vivox-tokens.css` (+ cópia na raiz), `index.html`, `index.css` · o conteúdo das telas continua no visual liquid glass até cada uma ser migrada; `glow` segue em `utils/sidebarPrefs.ts` sem uso.
- 2026-10-16 · `docs/memoria-e-design-system` · Criados `AGENTS.md`, `CLAUDE.md`, `docs/MEMORIA_DO_SISTEMA.md`, `docs/DESIGN_SYSTEM.md` e `docs/CRUZAMENTO_TELAS_DADOS.md`; `docs/CONTEXT.md` e `docs/ARCHITECTURE.md` marcados como desatualizados; agent `frontend-ui` aponta para os novos docs · só documentação · defeitos D1 e D3–D6 abertos (D1 e D3 em correção na branch `fix/senha-esqueci-ga4`); D2 descartado após revisão.
