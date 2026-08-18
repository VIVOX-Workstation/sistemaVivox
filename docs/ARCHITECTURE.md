# ARCHITECTURE.md — sistemaVivox

> Validado contra o código em 2026-08-18.

## Padrão

Monólito modular NestJS. Cada módulo em `backend/src/<modulo>/` segue o padrão
CLI do Nest (`module/controller/service/dto`). Os arquivos `entities/*.entity.ts`
de vários módulos são stubs vazios não usados — o Prisma Client é a fonte real
de tipos, não as entities do Nest.

**Divergência importante do plano original**: `VIVOX_backend_arquitetura.md`
descreve comunicação entre módulos via fila de eventos (BullMQ/Redis). Isso
**não existe no código** — módulos se comunicam por chamada direta de service
(injeção normal do Nest) ou nem se comunicam. Redis está provisionado no Docker
mas sem nenhum uso real. Antes de adicionar fila de eventos de verdade, decidir
conscientemente se ainda é a direção certa ou se o acoplamento direto atual é
aceitável no estágio atual do produto — não implementar fila "porque estava no
plano" sem revalidar a necessidade.

## Banco de dados

PostgreSQL com extensão `pgvector` (imagem `pgvector/pgvector:pg16`). 20 models
no `schema.prisma`, cobrindo: `User`, `Cliente`, `FonteContexto`,
`DocumentoVetorial` (RAG, coluna `vector(1536)`), `InteligenciaMercado`,
`ServicoContratado` + `ServicoHistorico`, `Producao`, `MidiaCliente`,
`AnalyticsSnapshot`, `Publicacao`, `AvaliacaoGmb`, `Oportunidade`, `Reuniao`,
`PlanejamentoServico` + `EscopoItem` + `Marco` + `ReferenciaServico` +
`HistoricoServico`, `AtivoHospedagem`.

**Risco**: só existe uma migration (`20260804220925_init_clientes_analytics`)
para 20 models atuais — indício de schema evoluído via `prisma db push`/edição
manual sem gerar migrations subsequentes. Isso causa drift entre dev/prod e
dificulta rollback. Ver TASK-005.

O índice HNSW (`create_hnsw_index.ts`, cosine, sobre `DocumentoVetorial.vetor`)
roda **fora** do fluxo de migração — precisa ser executado manualmente em
qualquer ambiente novo.

## Módulos e o que fazem

| Módulo | Estado | Resumo |
|---|---|---|
| `auth` | funcional, com débito de segurança | Login JWT (email/senha). `seed-admin` sem guard. |
| `users` | funcional | CRUD + seed. Método `setup()` existe mas não é exposto (código morto). |
| `clientes` | funcional | CRUD de `Cliente` + `FonteContexto` (fontes do "segundo cérebro"). Sem paginação. |
| `servicos` | funcional, simples | CRUD de `ServicoContratado`. |
| `producoes` | funcional, simples | CRUD de `Producao`, upload single-file via `StorageService`. |
| `midias` | funcional, simples | CRUD de `MidiaCliente`, upload multi-file. |
| `hospedagem` | maduro | CRUD de `AtivoHospedagem` + `GET /hospedagens/radar` (dashboard de renovação/vencimento). |
| `planejamento-servico` | mais maduro do backend | Fluxograma de marcos com dependências, Gantt, Kanban de escopo, trilha de auditoria (`HistoricoServico`). Único módulo com testes. |
| `analytics` | maduro, com placeholder | GA4 + Search Console reais (Service Account). Cache em memória (não Redis). `getResultados()` **gera oportunidades mock quando não há dado persistido** — placeholder de MVP misturado com dado real, sem flag para o frontend distinguir. |
| `ia` | funcional, sem auth | RAG via embeddings OpenAI + pgvector (fallback textual sem `OPENAI_API_KEY`). Chat via Groq com streaming. Pesquisa de mercado diária (`@nestjs/schedule` cron 6h, Tavily + Groq). Geração de mapa mental via LLM. **Nenhum endpoint tem guard.** |
| `storage` | funcional, hack de dev | Fino sobre S3. Gera URL pública trocando `minio`→`localhost` na string — específico do Docker local, frágil em produção. |

## Frontend (vivox-clientes)

React Router v7, rotas protegidas por `PrivateRoute`/`AuthContext`
(`localStorage`, sem estado global). Estrutura principal:
`/` (dashboard), `/clientes` + `/cliente/:id` (perfil com abas: Overview,
Hospedagem, Mercado/IA, Mapa de Serviços, Produções, Mídias, Anotações),
`/cliente/:id/servicos/:servicoId/planejamento` (fluxograma/Gantt/Kanban),
`/analytics` + `/analytics/:id`, `/configuracoes`.

Interface existe para quase todo módulo backend. Não há tela dedicada de
"Produções" fora das abas do cliente.

## Segurança (estado atual, ver TASKS.md para ações)

- Sem guard global — cada controller aplica `@UseGuards(JwtAuthGuard)`
  individualmente. `AuthController` (esperado) e `IaController` (não esperado)
  ficam sem guard.
- CORS totalmente aberto (`app.enableCors()` sem allowlist).
- Segredos reais estiveram versionados no Git até 2026-08-18 (ver DECISIONS.md).
