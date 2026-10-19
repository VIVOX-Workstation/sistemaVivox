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
| `clientes/:clienteId/propostas` | CLIENTES (ADMIN e COLABORADOR) | — |
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

Exceção autorizada para propostas: `GET /propostas-publicas/:token` usa
`PropostaLinkGuard`, sem JWT. O segredo aleatório do link tem 256 bits; o banco
guarda só SHA-256. A resposta usa uma lista explícita de campos do documento,
sem relação com o cadastro do cliente. Gerar outro link invalida o anterior;
revogar ou excluir a proposta impede novas consultas. Não há cache da resposta.

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
| `/cliente/:id?tab=propostas` | `features/propostas/PropostasTab.tsx` | `GET/POST /clientes/:id/propostas`, `PATCH/DELETE /clientes/:id/propostas/:pid`, `POST/DELETE /clientes/:id/propostas/:pid/compartilhar` |
| `/proposta/:token` | `features/propostas/PropostaPublica.tsx` (sem login) | `GET /propostas-publicas/:token` |
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

Schema: `backend/prisma/schema.prisma` (39 models). Os que mais aparecem na interface:

| Assunto | Model | Observação |
|---|---|---|
| Cliente | `Cliente` | `contatos` é JSON; `loginsSenhas` é texto livre; tokens da Meta ficam aqui |
| Proposta comercial | `Proposta` | Cliente, título, destinatário, apresentação, validade opcional, cor e seções em JSON (`titulo`, `texto` em Markdown e `html` opcional para preservar o modelo visual). `linkHash` habilita compartilhamento; nunca sai na API |
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

Migrações: `backend/prisma/migrations/` (32 até hoje). Sempre gere migration
(`prisma migrate dev`); produção usa `prisma migrate deploy` no boot.

---

## 5. Armadilhas conhecidas (leia antes de mudar algo)

### Propostas comerciais

- A visualização usa rolagem contínua da página, sem navegação por slides ou
  rolagem interna no iframe. No desktop, a barra à direita acompanha a leitura
  com criação, validade e download em PDF. O encerramento contém apenas a imagem
  fornecida, sem o antigo rodapé textual. O PDF é gerado no navegador.
- A proposta abre com `assets/capaProposta.webp` e, imediatamente depois,
  `assets/subCapa.webp`. `assets/propostaFinal.webp` encerra o documento após o
  conteúdo. As três imagens mantêm a proporção original, tanto na prévia quanto
  no link público. São importadas inline para funcionar no iframe com a CSP
  existente, sem liberar imagens externas nem mudar os dados no backend.
- A capa segue a referência enviada: nome do destinatário em branco acima de
  “Proposta Comercial” e “2026”, em dourado e em duas linhas, no canto inferior
  esquerdo. A subcapa
  integra o rótulo “Proposta comercial”, o título e a apresentação editáveis sobre
  a imagem; no celular, o texto vai abaixo da imagem para continuar legível.
  O antigo cabeçalho separado foi incorporado à subcapa.

- Clientes › Propostas permite criar em branco ou pelo modelo de plataforma de
  ensino fornecido pelo usuário (sem Kemax), editar todos os textos, tabelas,
  valores, condições, títulos e a ordem das seções. O modelo conserva o HTML e
  a estrutura da referência fornecida (capa escura, cartões e comparativo), com
  a paleta VIVOX da capa: preto quente, dourado e superfícies neutras/bege,
  com edição visual dos textos e opção de editar o código da seção. Seções novas
  de texto usam Markdown. Prévia e página pública usam o mesmo renderer.
- O HTML fica no JSON de seções e no DTO, sem alteração adicional de schema.
  No navegador, DOMPurify permite só tags de estrutura e atributos de classe e
  tabela; não aceita scripts, eventos, estilos arbitrários, URLs nem embeds.
  O documento e o editor ficam em iframes com sandbox sem scripts e CSP sem
  recursos externos, isolando o CSS original dos estilos do sistema.
- Documentos antigos ainda idênticos ao modelo recuperam o HTML original ao
  abrir/visualizar. Texto personalizado nunca é substituído. Na gravação, a
  estrutura recuperada passa a fazer parte do documento.
- O antigo destaque magenta padrão (`#b90679`) é normalizado para dourado
  (`#91672b`) também nas propostas já salvas, no editor e no documento público.
  Cartões, indicadores, comparativos, fundos e bordas usam os tons da capa;
  cores personalizadas diferentes do antigo padrão continuam editáveis.
- Após alterar o schema no Docker local, é necessário regenerar o Prisma Client
  e aplicar migrations também no container (o `node_modules` dele é um volume
  diferente do Windows). Reiniciar `vivox-backend` executa os dois comandos no
  boot. Em 2026-10-19, a ausência dessa atualização causou erros de compilação
  (`PropostaSelect`/`prisma.proposta`) e falha no salvamento; corrigido localmente.
- A proposta começa sem link. Salvar uma proposta já compartilhada atualiza o
  documento visto no mesmo link. Não há aprovação/assinatura ou conversão em
  contrato. A validade é informativa; a equipe desativa o acesso pelo botão.
- O token original só aparece ao gerar o link e não é guardado no navegador.
  Depois de sair do editor, é necessário gerar outro link para compartilhar
  novamente; isso revoga o anterior. O campo do link permite copiar manualmente.
- A listagem mostra um ícone de compartilhar por proposta. Ele gera o link da
  proposta salva e abre um diálogo para copiar ou visualizar, sem abrir o editor.
  O destinatário acessa apenas `/proposta/:token`, sem login nem controles de
  edição. Se já houver link ativo, a interface confirma a substituição.
- Nome do destinatário é próprio do documento; editar não altera o cadastro.
  O modelo de ensino contém condições e estimativas de referência, editáveis.
- Validação em 2026-10-19: navegador com ADMIN, COLABORADOR só com CLIENTES,
  COLABORADOR só com EDUCACIONAL (redirecionado ao tentar acessar propostas),
  CLIENTE (restrito ao portal) e visitante sem sessão (vê apenas o documento
  compartilhado). Dados fictícios em PostgreSQL isolado, migrações aplicadas
  do zero. Build do backend e build/lint do frontend passaram; testes novos
  de propostas: 18/18. A suíte completa mantém duas falhas anteriores nos
  testes gerados de Planejamento, que não injetam PrismaService/JwtAuthGuard.

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

- 2026-10-19 · `feat/propostas-clientes` · Propostas com rolagem contínua única, barra lateral com criação/validade e download em PDF; removido rodapé textual antes da imagem final · `PropostaDocumento`, `documentoHtml`, `baixarProposta`, `propostas.css`, seleção pública de `createdAt` · sem push/PR.

Uma linha por PR, mais recente no topo. Formato:
`AAAA-MM-DD · branch/PR · o que mudou para quem usa · arquivos ou módulos principais · pendências`.

- 2026-10-19 · `feat/propostas-clientes` · Ícone de compartilhar na listagem de propostas abre diálogo com link exclusivo de visualização, botão de copiar e prévia pública; mantém aviso ao substituir link ativo · `PropostasTab.tsx` · usa os endpoints e as permissões existentes, sem mudança no backend.

- 2026-10-19 · `feat/propostas-clientes` · Paleta da capa aplicada ao restante da proposta: dourado, preto quente e neutros/bege substituem magenta, lilás e cinzas roxos em cartões, textos, tabelas e destaques; propostas já salvas com a cor antiga também recebem o dourado · `referencia.css`, `propostas.css`, `modeloLegado.ts`, defaults e render do documento · sem mudança de API ou conteúdo.

- 2026-10-19 · `feat/propostas-clientes` · Capa ajustada à imagem de referência: cliente em branco acima de “Proposta Comercial” e “2026” em dourado, alinhados à esquerda, com escala proporcional à largura da imagem · `documentoHtml.tsx`, `referencia.css` · destinatário continua editável no formulário.

- 2026-10-19 · `feat/propostas-clientes` · Nome do cliente e “Proposta Comercial 2026” sobre a capa; título e apresentação incorporados à subcapa, com adaptação para celular · `documentoHtml.tsx`, `referencia.css` · dados vêm de `destinatario`, `titulo` e `apresentacao`, sem novo campo ou endpoint.

- 2026-10-19 · `feat/propostas-clientes` · Incluídas as imagens fornecidas pelo usuário como capa, subcapa imediatamente após a capa e encerramento, na prévia e no compartilhamento · `documentoHtml.tsx`, `referencia.css`, `assets/capaProposta.webp`, `assets/subCapa.webp`, `assets/propostaFinal.webp` · sem mudança de API ou dados; imagens responsivas e empacotadas inline para respeitar a CSP.

- 2026-10-19 · `feat/propostas-clientes` · Corrigido salvamento no Docker local: Prisma Client regenerado e migration aplicada no serviço usado pelo sistema. Propostas passam a conservar HTML/CSS da referência, com edição visual de cartões/tabelas, compatibilidade com textos antigos e mensagens de erro específicas · `features/propostas`, `SecaoPropostaDto`, `PropostasService`, DOMPurify · 19 testes de propostas, teste HTTP no backend local :3000, verificação do render/isolamento, builds e lint passaram; publicação em produção continua pendente. Browser não pôde ser revalidado nesta correção por bloqueio de protocolo na ferramenta.

- 2026-10-19 · `feat/propostas-clientes` · Propostas por cliente para ADMIN e colaboradores com CLIENTES, edição completa por seções, modelo de ensino sem Kemax e visualização por link exclusivo revogável · `backend/src/propostas`, model/migration `Proposta`, `features/propostas`, lista/perfil de clientes · migration validada em banco isolado; aplicar via deploy no ambiente alvo. Builds e lint do front passaram (avisos anteriores); 18 testes novos e integração HTTP/PostgreSQL passaram; suíte geral: 214 passaram e 2 testes antigos de Planejamento falharam por providers ausentes. Implementação autorizada pelo usuário após referência e prévia nesta conversa; sem push/PR.

- 2026-10-16 · `style/layout-clean` · Estrutura base no visual clean: menu lateral branco (recolhe sozinho em tela estreita), atalhos Minhas tarefas e Chamados no menu, barra superior com o nome da tela e o botão "Assistente", assistente IA em painel lateral claro, sem marca d'água e sem a seção "Em breve"; fonte Geist e tokens `--vx-*`; opção "Luz dourada do menu" saiu de Configurações › Aparência · `components/Layout.tsx`, `components/FloatingAssistant.tsx`, `components/brand/VivoxLogo.tsx`, `components/ia/QuickPromptChips.tsx`, `pages/Configuracoes.tsx`, `design-system/vivox-tokens.css` (+ cópia na raiz), `index.html`, `index.css` · o conteúdo das telas continua no visual liquid glass até cada uma ser migrada; `glow` segue em `utils/sidebarPrefs.ts` sem uso.
- 2026-10-16 · `docs/memoria-e-design-system` · Criados `AGENTS.md`, `CLAUDE.md`, `docs/MEMORIA_DO_SISTEMA.md`, `docs/DESIGN_SYSTEM.md` e `docs/CRUZAMENTO_TELAS_DADOS.md`; `docs/CONTEXT.md` e `docs/ARCHITECTURE.md` marcados como desatualizados; agent `frontend-ui` aponta para os novos docs · só documentação · defeitos D1 e D3–D6 abertos (D1 e D3 em correção na branch `fix/senha-esqueci-ga4`); D2 descartado após revisão.
