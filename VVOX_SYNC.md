# VVOX Sync — desenvolvimento local

A base canônica desta integração é `C:\Users\pfeihmartins\Codex\bitrix2.0\sistemaVivox`. Use os comandos abaixo nessa cópia para não abrir uma execução de outro checkout.

## Iniciar

Antes de iniciar, PostgreSQL, Redis e MinIO devem estar ligados no Docker e acessíveis, respectivamente, em `127.0.0.1:5432`, `127.0.0.1:6379` e `127.0.0.1:9000`. O arquivo `.env` da raiz deve conter as credenciais locais. As dependências de `backend` e `vivox-clientes` devem estar instaladas; use `npm ci` em cada pasta se necessário.

```powershell
cd C:\Users\pfeihmartins\Codex\bitrix2.0\sistemaVivox\vivox-clientes
npm run dev:sync
```

Use Node.js 20.19+ ou 22.12+. A primeira carga do backend pode levar até dois minutos.

O comando verifica se as portas 3001 e 5174 estão livres, gera o Prisma Client, aplica as migrações locais pendentes, compila o backend e inicia os dois serviços. Ele não inicia nem altera os contêineres Docker e não encerra processos que já ocupam essas portas.

- Sistema e Kanban: [http://localhost:5174/gp](http://localhost:5174/gp)
- Backend: [http://localhost:3001](http://localhost:3001)
- MinIO para os anexos: [http://localhost:9000](http://localhost:9000)

Use **Ctrl+C** no terminal para encerrar o backend e o frontend iniciados pelo comando. Se um desses processos terminar, o launcher encerra o outro. O build do backend ocorre ao iniciar; depois de alterar seu código, reinicie o comando. O Vite atualiza o frontend durante o desenvolvimento.

O launcher lê o `.env` da raiz sem exibir seu conteúdo. Ele aceita apenas `DATABASE_URL` com protocolo PostgreSQL e host `postgres`, `localhost` ou `127.0.0.1`, normalizando a conexão para `127.0.0.1:5432`. Uma URL de banco remoto ou parâmetros que substituam o host fazem o comando parar antes de qualquer migração. Backend e frontend usam as portas fixas 3001 e 5174, com bind em `127.0.0.1`. Redis e MinIO também são direcionados para os serviços locais. Essas substituições existem apenas no ambiente dos processos; `.env` e Docker Compose não são editados.

## Validar o frontend

Na pasta `vivox-clientes`:

```powershell
npm run build
npm run lint
```

Estes comandos verificam compilação e lint. O resultado deles não substitui a verificação no navegador dos fluxos de criar e mover tarefas, cronômetro, entrega, correção e aprovação.

## Estado da integração

A fonte visual desta versão é o pacote `kanban-vivox-pacote-codex.zip`, recebido em 10/10/2026, que corresponde à pasta `C:/Users/pfeihmartins/Codex/bitrix2.0/kanban-front`. O HTML monolítico enviado pelo usuário contém a mesma base visual. O arquivo `public/kanban/css/app.css` é uma cópia byte a byte da fonte, SHA-256 `F09E378630F3A51B4C3E11C412CF48A417C5C2BD4721F7F3E323E16EA9171F9E`.

O HTML e o JavaScript foram adaptados para sessão, dados e permissões reais; quatorze funções de renderização visual permanecem idênticas. `integration.css` acrescenta a correção de `[hidden]`, evita sobreposição no detalhe mobile e preserva a aparência do logo transformado em link. A folha `reference.css` da reconstrução anterior foi removida.

A rota `/gp` usa o renderizador em iframe com host React. O logo retorna a `/gp/projetos`. A migração integral para componentes JSX/TypeScript não foi feita.

### Dados e fluxos

- Quadros, colunas, tarefas, criação em lote, cliente, fonte, subtítulo e links usam a API autenticada.
- Busca, filtros, opções de cartão, calendário, atividade e recolhimento mantêm as interações da fonte.
- Executor e administrador podem operar o cronômetro; existe no máximo um timer ativo por usuário.
- Entrega encaminha para revisão. Proprietário, responsável pela revisão e administrador podem aprovar ou pedir correção. Arraste respeita as transições autorizadas pela API.
- Descrição, etapas, comentários, anexos e áudio persistem. Áudio pode ser enviado como arquivo ou gravado pelo microfone com permissão do navegador; o player funciona após recarregar.
- Links aceitam HTTP/HTTPS, no máximo 30 por tarefa. A API registra autor e data; participantes podem adicionar, e a exclusão respeita autoria e permissão de edição.
- O sino leva à atividade real da equipe; não são exibidas notificações de exemplo.

As pessoas e tarefas de demonstração não são dados de trabalho. O tema padrão é WB · Claro. Tema, opções de cartão e preferências visuais das colunas ficam no navegador; plano de publicação persiste na API. Logos locais de clientes e preferências de dias do calendário continuam locais. A edição de perfil nesta janela não simula gravação na conta quando não existe uma rota correspondente.

### Migração desta versão

`20261010183000_sync_artifact_task_fields` é aditiva: inclui cliente, fonte, subtítulo e links em Tarefa; plano de publicação em KanbanColuna; tipo/tamanho de anexo e duração de áudio em TarefaComentario. Foi aplicada ao PostgreSQL local durante esta integração. `dev:sync` aplica migrações pendentes ao iniciar, conforme as restrições locais descritas acima.

### Verificação em 10/10/2026

Build e lint do frontend aprovados; o build ainda informa o aviso de tamanho de alguns chunks. Os 21 testes unitários das três suítes do Kanban passaram, incluindo persistência e permissões de links e áudio.

Os 18 cenários E2E passaram: criação, atribuição, descrição, checklist, chat, anexos, criação em lote, links, áudio enviado e gravado, reprodução após recarga, timer, entrega, correção e aprovação. Uma verificação visual adicional confirmou busca, filtros, calendário, atividade, menus, recolhimento e arraste com persistência na API e após recarga.

A revisão comparou o pacote original ao quadro em 2298px, 1775px e 390px, e ao detalhe desktop/mobile. Também foi feita uma captura somente de leitura do diário real. Não houve erro JavaScript ou de limpeza; os dados temporários foram removidos e os registros reais preservados.

Relatórios da sessão ficam em `C:/Users/pfeihmartins/Documents/Codex/2026-10-09/https-github-com-vivox-workstation-sistemavivox/work`: `sync-updated-source-e2e-result.json`, `sync-artifact-persistence-unit.json` e `sync-updated-source-final-visual-result.json`. A referência visual estável do repositório é `.impeccable/references/claude-export-20261010-board.png`.

A implantação em produção usa o fluxo de deploy existente do repositório; o backend aplica as três migrações novas com `prisma migrate deploy`.

## Integração com a versão atual do GitHub

A atualização foi integrada sobre `57ca2b4` de `origin/main`, preservando o portal do cliente, permissões por módulo, callbacks de autenticação, páginas e melhorias existentes. `/gp` abre VVOX Sync; `/gp/projetos` mantém o hub de projetos; workspaces e Minhas Tarefas conservam suas rotas.

A regra existente que restringe alterações de prazo ao administrador permanece. Reimportações Bitrix e movimentações em lote usam transições autorizadas e versionadas. Colunas personalizadas do GP legado são persistidas quando utilizadas, e seu modal salva campos e mudança de etapa separadamente, exibindo erros e recarregando a tarefa.

Validação da integração: schema Prisma válido, builds de backend e frontend aprovados, lint sem erros e 103 testes em 13 suítes aprovados. Os lockfiles e a infraestrutura remotos foram preservados. A verificação visual documentada acima corresponde ao mesmo CSS e renderizadores do painel.
