# Cruzamento: telas × dados × backend

> Feito em 2026-10-16 contra a `main` (`38b1d16`). Compara cada elemento do
> protótipo [Sistema VIVOX — interface clean](https://claude.ai/artifact/955gUjgrSQTvjJ52K1XZGV)
> com o que o sistema tem de verdade. Use antes de implementar qualquer tela.

## Como ler

| Situação | Significa |
|---|---|
| **Existe** | Dado e ação já existem no backend e no front atual. Só muda o visual |
| **Ajustar** | Existe, mas o protótipo mostra diferente do dado real. Siga a coluna "Real" |
| **Falta backend** | O protótipo mostra algo que a API não entrega. Precisa de endpoint, campo ou cálculo novo antes do front |
| **Só no navegador** | Preferência guardada no `localStorage`, sem servidor |
| **Defeito** | Já existe na interface, mas não funciona hoje (ver `MEMORIA_DO_SISTEMA.md › 5.2`) |

Resumo: das 24 telas do protótipo, **19 são troca de visual sobre dados que já
existem**. As diferenças estão concentradas no Dashboard, Hospedagens, Analytics
do cliente e Portal. Há **2 defeitos** que valem corrigir antes do redesign
(D1 esqueci a senha, D3 senha gravada sem criptografia).

---

## Acesso

### Login interno (`/login`)

| Elemento | Situação | Real |
|---|---|---|
| E-mail e senha, mostrar senha | Existe | `POST /auth/login` |
| Links Sobre, Privacidade e Termos | Existe | `LoginVivox.tsx` aponta para HTML estático em `public/sobre/`, `public/privacidade/` e `public/termos/`; não usa API nem dados de usuário |
| Manter conectado | Ajustar | A caixa aparece, mas `Login.tsx` ignora o valor. A sessão sempre fica no `localStorage` e o JWT dura 1 dia |
| Esqueci minha senha → enviar ao suporte | **Defeito D1** | O front chama `POST /auth/esqueci-senha`, que não existe |
| Link "Entre pelo portal" | Só no protótipo | Fácil de adicionar (rota `/portal/entrar` existe) |

### Portal · entrar (`/portal/entrar`)

| Elemento | Situação | Real |
|---|---|---|
| Login e senha | Existe | Mesmo `POST /auth/login`; volta para `?destino=` |
| Credenciais enviadas pela equipe | Existe | Geradas em Perfil › Acesso ao portal |

### Sem acesso (`/sem-acesso`)

| Elemento | Situação | Real |
|---|---|---|
| Mensagem e saída automática ao liberar | Existe | `useRotaInicial()` em `App.tsx` |
| Só aparece se o admin tirar todos os módulos | Atenção | Usuário novo já nasce com os 7 módulos |

---

## Núcleo

### Dashboard (`/`) — `GET /analytics/dashboard-executivo`

| Elemento | Situação | Real |
|---|---|---|
| Saudação com nome | Existe | `user.nome` |
| Clientes ativos / prospects | Existe | `clientes.ativos`, `clientes.prospects` |
| Serviços ativos "em N tipos" | Existe | `servicos.ativos`, `servicos.porTipo.length` |
| Tarefas abertas / vencendo em 7 dias | Existe | `tarefas.abertas`, `tarefas.vencendoSemana` |
| Tarefas atrasadas "N de alta prioridade" | Ajustar | Só `tarefas.atrasadas`; a contagem por prioridade sai de `atrasadasLista` (limitada) |
| Chamados abertos / SLA vencido | Existe | `chamados.abertos`, `chamados.slaVencidos` |
| Hospedagens críticas | Ajustar | `landingPages.criticos7Dias` = **7 dias**, não 15 |
| Lista "Precisa de atenção hoje" | Existe | `tarefas.atrasadasLista`, `chamados.recentes`, `landingPages.proximosVencimentos` |
| Esta semana: vencendo, concluídas, horas | Existe | `vencendoSemana`, `concluidasSemana`, `horasGastas` |
| Meta de entregas (31 de 40) | **Falta backend** | Não existe meta. Remover ou criar campo de meta |
| Aba Tarefas: concluídas por semana | Existe | `tarefas.concluidasPorSemana` |
| Aba Tarefas: por etapa (cores do Sync) | Ajustar | Real é `tarefas.porStatus` com status do GP (A fazer, Em andamento, Em revisão, Concluída…), não colunas do Sync |
| Aba Analytics: alcance, cobertura, top 5 | Existe | `analytics.serieAlcance`, `clientesComGa4/Instagram/Openpanel`, `topClientesAlcance` |
| Aba Clientes: novos por mês, últimos cadastrados | Existe | `clientes.novosPorMes`, `ultimosClientes` |
| Assistente IA | Existe | `POST /ia/chat`; "criar card" usa `POST /ia/productions/create-from-ai` |
| Permissão | Atenção | Colaborador só com DASHBOARD consegue ler (regra `leitura: DASHBOARD`) |

### Clientes (`/clientes`) — `GET /clientes`

| Elemento | Situação | Real |
|---|---|---|
| Busca por nome, segmento, responsável | Existe | Filtro no front |
| Filtros por status com contagem | Existe | `StatusCliente`: ATIVO, PROSPECT, PAUSADO, ENCERRADO |
| Coluna "Serviços" com nomes | Ajustar | A lista traz só `_count.servicosContratados` (número) |
| Responsável | Existe | `responsavel.nome` |
| Cliente desde | Existe | `dataInicioContrato` (ou `createdAt`) |
| Acesso às propostas por cliente | Existe (2026-10-19) | Link na lista para `/cliente/:id?tab=propostas` |

### Novo cliente (`/cliente/novo`) — `POST /clientes`

| Elemento | Situação | Real |
|---|---|---|
| Nome fantasia, razão social, CNPJ/CPF, segmento, e-mail, telefone | Existe | `CreateClienteDto` |
| Status, início do contrato | Existe | |
| Responsável interno | Ajustar | Existe no DTO (`responsavelId`), mas o formulário atual não pede |
| GA4 | Existe | `ga4PropertyId` no `CreateClienteDto` |
| Search Console, OpenPanel | Existe | `gscSiteUrl`, `openpanelProjectId` |
| Acessos e observações | Existe | `loginsSenhas`, `observacoes` |
| Depois de salvar vai para o perfil | Ajustar | Hoje volta para `/` |

### Perfil do cliente (`/cliente/:id`)

| Elemento | Situação | Real |
|---|---|---|
| Logo e capa | Existe | `upload-logo`, `upload-banner` ou URL |
| Status editável | Existe | `PATCH /clientes/:id` |
| Botão Analytics, Acesso ao portal, Editar cadastro, Criar chamado | Existe | |
| Editar cadastro: campo GA4 | Existe | Salvo por `PATCH /clientes/:id` |
| Indicadores: serviços, hospedagens, tarefas, chamados | Existe | `OverviewTab` |
| Próximas entregas | Existe | Tarefas do cliente (`GET /tarefas`) |
| Contatos | Existe | `Cliente.contatos` (JSON) |
| Aba Serviços: contratados + disponíveis + histórico | Existe | `ServicesTab`, `ServicoHistorico` |
| Botão do serviço abre Planejamento ou DevBoard | Existe | Tipo `APP` → DevBoard |
| "Ver tarefas" do serviço | Existe | `/gp?clienteId=…&servicoId=…` (abre a visão de lista do GP) |
| Aba Anotações com "Salvo agora" | Ajustar | Salva com botão (`observacoes`), não automaticamente |
| Aba Propostas: criar, editar tudo, excluir | Existe (2026-10-19) | `GET/POST /clientes/:id/propostas`, `PATCH/DELETE /clientes/:id/propostas/:pid`; model `Proposta`, `SalvarPropostaDto` + `SecaoPropostaDto` |
| Modelo de plataforma de ensino | Existe (2026-10-19) | Referência fornecida pelo usuário, sem Kemax; HTML e CSS originais preservados, seis seções, modalidades, comparativo e condições, todos editáveis visualmente ou pelo código HTML; `Proposta.secoes[].html` + `SecaoPropostaDto.html` |
| Capa, subcapa e encerramento da proposta | Existe (2026-10-19) | Assets locais `capaProposta.webp`, `subCapa.webp` e `propostaFinal.webp`, nessa ordem, na prévia e no documento público; não exige campo no backend |
| Compartilhar, consultar link ativo e revogar | Existe (2026-10-20) | `GET/POST/DELETE /clientes/:id/propostas/:pid/compartilhar`; `Proposta.linkHash` e `linkTokenCriptografado` (AES-256-GCM); GET recupera sem substituir; campos internos não são editáveis pelo DTO |
| Compartilhar na lista de propostas | Existe (2026-10-20) | “Ver link ativo” consulta o mesmo link e abre diálogo com copiar/visualizar; gerar outro link exige confirmação; links antigos só com hash precisam de substituição uma vez |
| Prévia da capa ao compartilhar | Existe (2026-10-20) | Nginx injeta Open Graph em `/proposta/:token`, com capa JPEG pública `/proposta-capa.jpg` (mesma imagem de `capaProposta.webp`), título/descrição genéricos; não depende de executar React; requer publicação pública para WhatsApp |
| Acesso ao portal: URL, login, senha, gerar nova, copiar para WhatsApp, interesses | Existe | `/clientes/:id/acesso-portal`, `/redefinir-senha`, `/interesses` |

---

## Serviços do cliente

### Planejamento (`/cliente/:id/servicos/:sid/planejamento`)

| Elemento | Situação | Real |
|---|---|---|
| Lista de entregas com etapa e prazo | Existe | `flowNodes` (ver armadilha 5.1.1) |
| Etapas: Briefing → Concluído | Existe | `ItemPlanejado.status` |
| Objetivo, público, mensagem, prazo, referências | Existe | `descricao`, `publico`, `oferta`, `prazo`, `referencias` |
| Roteiro em passos | Ajustar | Real: `estrutura[]` com título, texto e CTA por seção; modelo inicial depende do tipo do serviço |
| Etapas de produção (checklist) | Existe | `etapas[]` |
| Tarefa vinculada / criar tarefa | Existe | `tarefaIds[]` + `POST /tarefas`. Link deve abrir a tarefa no Sync |
| Hospedagem da landing page, protótipo, link final | Existe | `AtivoHospedagem` + `linkFinal` + `linkFigma` |
| Registrar chamado da entrega | Existe | `Chamado.itemPlanejadoId` |
| Ideias com IA | Existe | `POST /ia/chat` |
| "Salvo" | Existe | Fila de salvamento automático |

### DevBoard (`/cliente/:id/servicos/:sid/devboard`)

| Elemento | Situação | Real |
|---|---|---|
| 4 colunas, tags, responsável, PR | Existe | `DevBoardCard` |
| Detalhe com descrição, checklist, mover | Existe | `PATCH /devboard/:id` |
| Nova issue | Ajustar | Cria **card** no DevBoard; não cria issue no GitHub |
| Vincular PR, PRs aguardando | Existe | `GET /devboard/servico/:sid/github/sync` |
| Trocar repositório | Existe | `installation-repos`, `select-repo`, `disconnect` |

### Hospedagens (`/hospedagens`) — `GET /hospedagens/radar`

| Elemento | Situação | Real |
|---|---|---|
| Indicadores | Ajustar | Real: total, críticos (≤ 7 dias ou vencido), atenção (≤ 30), em dia, sem data |
| Filtros "Vencidas / 30 / 90 dias" | Ajustar | Use os níveis reais: Críticos, Atenção, Em dia, Sem data |
| Próximos 6 meses | Existe | Painel atual |
| Tipo SSL com data | **Falta backend** | `sslAtivo` é só sim/não, sem vencimento |
| Domínio e VPS com data | Existe | `dataExpiracaoDominio`, `dataRenovacaoVps` |
| Abrir cliente | Existe | Leva ao perfil, aba Serviços |

### Analytics (`/analytics`)

| Elemento | Situação | Real |
|---|---|---|
| Busca e filtros | Existe | Todos, Com analytics, Ativos, Sem integração |
| Selos GA4, Search Console, OpenPanel, Instagram | Existe | Campos do cliente |
| Alcance em 30 dias por cliente | Existe | `GET /analytics/sparklines` (alcance/seguidores) |

### Painel do cliente (`/analytics/:id`)

| Elemento | Situação | Real |
|---|---|---|
| Aba Site: usuários, sessões | Ajustar | Hoje vem do **OpenPanel** (`ClientPerformanceDashboard`). GA4 está pronto no backend (`GET /analytics/google/:id`), mas o componente `GoogleAnalyticsDashboard` não é usado |
| "Agendamentos pelo site" | **Falta backend** | Não há métrica de conversão. Mais perto: "Conversão WhatsApp" (OpenPanel) ou `eventCount` por evento (GA4) |
| Posição média na busca | Ajustar | Search Console existe no backend, sem tela |
| Origem do tráfego, páginas mais vistas | Existe | OpenPanel (`referrers`, páginas) ou GA4 (`sessionDefaultChannelGroup`, `pagePath`) |
| Dados de exemplo quando a fonte falha | Existe | Selo "Modo demonstrativo" |
| Período 7 / 30 / 90 dias | Existe | Instagram também aceita período personalizado |
| Aba Instagram: seguidores, alcance, engajamento, melhores posts | Existe | `GET /analytics/instagram/:id` + OAuth Meta |

---

## Operação

### Acompanhamento (`/acompanhamento/:clienteId`)

| Elemento | Situação | Real |
|---|---|---|
| Escolha do cliente e do mês | Existe | Também aceita período personalizado e vários meses |
| Indicadores do mês | Existe | `ResumoAcompanhamentoCards` |
| Filtro por tipo | Ajustar | Tipos reais: Post, Reels, Carrossel, Story, Vídeo |
| Colunas da planilha | Ajustar | Real: Data, Tipo, Assunto, Link, Curtida, Comentário, **Repost**, Envios, Salvamento, **Visualização**, Alcance. O protótipo omitiu Repost e Visualização |
| Exportar / importar backup JSON | Existe | |
| Nova publicação, editar na linha | Existe | |
| Compartilhar com o cliente | Existe | Link para `/portal/acompanhamento?…` |
| Cronogramas em PDF (enviar, ver, excluir) | Existe | `CronogramaCliente` |

### Minhas tarefas (`/gp/minhas-tarefas`, `/gp/workspace/:id`)

| Elemento | Situação | Real |
|---|---|---|
| Workspaces | Existe | Model `Projeto` |
| Visões | Ajustar | Real: Kanban (legado), Lista e Prazos |
| Filtros Todas, Em execução, Urgentes, Concluídas | Existe | |
| Prioridades | Ajustar | Real tem 4: Baixa, Média, Alta, **Urgente** |
| Horas | Existe | `horasGastas` |
| Detalhe: comentários, checklist, observadores, anexos | Existe | `TaskModal` |
| Alterar prazo | Atenção | Só ADMIN |
| Importar do Bitrix / backup, exportar | Existe | |
| Colunas do Kanban legado | Só no navegador | Ver armadilha 5.1.3 |

### Chamados (dentro do GP)

| Elemento | Situação | Real |
|---|---|---|
| Aberto, Em atendimento, Resolvido | Existe | `StatusChamado` |
| SLA por urgência, selo de vencido | Existe | `slaVencimento` |
| Categoria e urgência | Existe | 5 categorias, 3 urgências |
| Responsável, comentários, anexos | Existe | |
| "Virar tarefa" | Ajustar | Já acontece sozinho: todo chamado nasce com uma tarefa (`tarefaId`) |
| Tela própria no menu | Ajustar | Hoje é uma área dentro do GP (`ChamadosBoard`), sem rota própria |

### VVOX Sync

Fora deste redesign por decisão de 2026-10-16. Regras em `DESIGN.md` e `VVOX_SYNC.md`.

---

## Educacional e sistema

### Educacional, Curso, Gerenciar cursos, Editor

| Elemento | Situação | Real |
|---|---|---|
| Cursos publicados com capa | Existe | `Curso.publicado`, `capaUrl` + posição |
| Progresso por pessoa | Existe | `AulaProgresso` (marcar/desmarcar concluída) |
| Player de vídeo YouTube/Vimeo | Existe | `utils/videoEmbed.ts` |
| Gerenciar e editar (só ADMIN) | Existe | `/cursos/*` |
| Reordenar módulos e aulas arrastando | Existe | `@dnd-kit` + rotas `reordenar` |
| Duração detectada pelo link | Existe | `utils/durationDetection.ts` |

### Configurações (`/configuracoes`, só ADMIN)

| Elemento | Situação | Real |
|---|---|---|
| Lista da equipe, mudar papel (com confirmação) | Existe | `PATCH /users/:id/role` |
| Permissões por módulo | Existe | `PATCH /users/:id/modulos` |
| Editar usuário | Existe | |
| Redefinir senha / nova senha em Minha conta | **Defeito D3** | Senha gravada sem criptografia; o login quebra |
| Novo usuário | Existe | `POST /users` (devolve o hash da senha, D4) |
| Excluir usuário | Ajustar | Rota existe, a tela não oferece |
| Aparência: barra recolhida | Só no navegador | `utils/sidebarPrefs.ts` |
| Aparência: luz dourada | Só no navegador | Some no visual clean |
| Aparência: animação de entrada, densidade | Só no protótipo | Não existem como preferência |

---

## Portal do cliente

### Proposta compartilhada (`/proposta/:token`, sem login)

`GET /propostas-publicas/:token` valida o segredo do link e retorna apenas
`id`, `titulo`, `destinatario`, `apresentacao`, `validade`, `corDestaque`,
`secoes`, `createdAt` e `updatedAt`. Não há acesso ao cadastro interno. Seções aceitam Markdown
ou HTML comercial sanitizado com DOMPurify, renderizado em iframe com sandbox
sem scripts e CSP sem recursos externos. O CSS da referência não afeta a tela
do sistema. A validade é informativa. A leitura usa uma única rolagem contínua;
a barra à direita mostra criação, validade e download da proposta completa em PDF.
Link revogado, substituído ou proposta excluída resulta em indisponível.
O documento público não requer sessão do portal nem oferece aceite/assinatura.

| Elemento | Situação | Real |
|---|---|---|
| Serviços contratados com status e data | Existe | `GET /portal/mapa-servicos` |
| Progresso do serviço (9 de 12, 4 de 7 etapas) | **Falta backend** | O portal não recebe tarefas nem planejamento |
| Próxima entrega | **Falta backend** | Idem |
| Outros serviços + "Tenho interesse" com mensagem | Existe | `POST /portal/interesses` |
| Acompanhamento só leitura com troca de mês | Existe | `/portal/acompanhamento` |
| Cronogramas em PDF com visualização | Existe | `/portal/cronogramas` |

---

## O que fazer primeiro (sugestão)

1. Corrigir D3 (senha) e D1 (esqueci a senha): são pequenos e afetam o uso hoje. Em andamento na branch `fix/senha-esqueci-ga4`.
2. Ajustar o protótipo nos itens **Ajustar** desta lista, para o desenho bater com o dado real.
3. Decidir os itens **Falta backend** (meta de entregas, conversões, vencimento de SSL, progresso no portal): cada um vira tarefa de backend antes do front.
4. Migrar o visual tela a tela, começando por Dashboard, Clientes e Perfil.
