# Produção no Coolify

O ambiente `Sistema VIVOX / production` possui duas aplicações ligadas ao GitHub App
VIVOX Workstation e à branch `main` de `VIVOX-Workstation/sistemaVivox`.
Cada push na `main` reconstrói e publica o backend e o frontend automaticamente.
Pushes em outras branches não publicam em produção.

| Recurso | Configuração |
| --- | --- |
| Backend | Dockerfile.production, contexto `/`, porta interna 3000 |
| Frontend | vivox-clientes/Dockerfile, contexto `/vivox-clientes`, porta interna 80 |
| Banco | PostgreSQL 16 com pgvector, rede privada do Coolify |
| Uploads | MinIO, bucket vivox-media, volume persistente |
| Quadro colaborativo | excalidraw/excalidraw-room |

## Domínios

Os registros A abaixo devem apontar para `179.198.126.10`:

- flow.vivoxmarketing.com.br
- api.vivoxmarketing.com.br
- minio.vivoxmarketing.com.br
- quadro.vivoxmarketing.com.br

Para a emissão inicial dos certificados do Coolify, use os registros em DNS only.
Depois de confirmar os certificados, o proxy do Cloudflare pode ser ativado com
SSL/TLS em Full (strict). O quadro precisa de WebSockets habilitados.

## Banco novo e atualizações

O histórico antigo de migrations não reproduz todo o esquema atual, pois algumas
alterações anteriores foram feitas com `prisma db push`.
O comando `node scripts/start-production.cjs` permite a instalação inicial quando
`BOOTSTRAP_EMPTY_DATABASE=true` **e o schema public está completamente vazio**.
Ele cria o esquema atual em uma transação, inicializa o quadro Operação diária e
restaura os triggers, checks e índices parciais do Sync antes de registrar o histórico.
Um marcador temporário permite retomar o registro em caso de interrupção.
Em bancos existentes, apenas `prisma migrate deploy` é executado.
Após a primeira instalação, remova `BOOTSTRAP_EMPTY_DATABASE` no Coolify.

Para novas alterações de banco, versionar migrations Prisma junto ao código.
Não usar `db push`, `migrate reset` ou `--accept-data-loss` na produção.

A migration `20261011010000_repair_sync_bootstrap` também corrige instalações
que receberam apenas o schema Prisma. Ela cria o quadro padrão e suas colunas,
adota tarefas sem quadro e restaura as regras do Sync, preservando quadros,
numeração e dados existentes. Não é necessário reaplicar migrations antigas.

O teste de integração `node scripts/test-sync-bootstrap.cjs` deve ser executado
na pasta backend com `SYNC_BOOTSTRAP_TEST_DATABASE_URL` apontando para um
PostgreSQL de testes. Ele cria e remove apenas seus próprios bancos temporários.

## Variáveis e dados persistentes

As senhas, DATABASE_URL, JWT_SECRET e credenciais S3 ficam nas variáveis do Coolify.
O frontend recebe VITE_API_URL e VITE_EXCALIDRAW_WS_URL durante o build.
Chaves das integrações opcionais de IA, Google, Meta e OpenPanel podem ser
configuradas no backend conforme os recursos utilizados.

O PostgreSQL e o volume MinIO permanecem entre deploys das aplicações.
O bucket é inicializado por minio-init. O acesso público de leitura atende às URLs
de mídia utilizadas pelo sistema; escrita continua exigindo as credenciais S3.

O primeiro administrador pode ser criado por `POST /users/setup` com nome, email,
senha e role ADMIN. Esse endpoint só permite setup enquanto não existe usuário.

## Validação

- Backend: GET / deve responder 200.
- Frontend: GET / e rotas da SPA devem responder 200.
- MinIO: GET /minio/health/live deve responder 200.
- Quadro: GET /socket.io/?EIO=4&transport=polling deve iniciar uma sessão.
- Sync: GET /kanban/quadros autenticado deve incluir Operação diária com cinco colunas.
- Confirmar no Coolify que ambos os deploys têm o commit mais recente da main.
