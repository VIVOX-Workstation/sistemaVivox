# VIVOX Backend — ambiente local com Docker

Este ambiente sobe tudo que o backend precisa para rodar localmente, sem depender
de nenhuma conta na nuvem:

- **backend** — API NestJS (seu código, com hot-reload)
- **postgres** — banco de dados
- **redis** — cache e fila (BullMQ)
- **minio** — storage local compatível com S3 (substitui S3/R2 durante o dev)

## Estrutura de pastas esperada

```
SistemaVivox/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── backend/              ← aqui entra o código do NestJS
```

## Passo a passo para rodar

1. **Copiar o arquivo de variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   Ajuste valores se quiser (senhas, chaves), mas os valores padrão já funcionam
   para desenvolvimento local.

2. **Subir todos os serviços**
   ```bash
   docker compose up -d
   ```
   Isso sobe backend, banco, redis e o storage local. Na primeira vez o Docker
   baixa as imagens, pode demorar um pouco.

3. **Conferir se está tudo no ar**
   ```bash
   docker compose ps
   ```
   Você deve ver `vivox-backend`, `vivox-postgres`, `vivox-redis` e `vivox-minio`
   rodando.

4. **Acessar os serviços**
   | Serviço | URL |
   |---|---|
   | API do backend | http://localhost:3000 |
   | Console do MinIO (ver arquivos enviados) | http://localhost:9001 (login: `vivox` / senha: `vivox12345`) |
   | Postgres (para abrir num client como DBeaver/TablePlus) | `localhost:5432`, banco `vivox`, usuário `vivox`, senha `vivox` |

5. **Ver logs em tempo real** (útil durante o desenvolvimento)
   ```bash
   docker compose logs -f backend
   ```

6. **Parar tudo**
   ```bash
   docker compose down
   ```
   Os dados continuam salvos (em volumes). Para apagar os dados também (recomeçar
   do zero):
   ```bash
   docker compose down -v
   ```

## Fluxo do dia a dia

- Você edita o código dentro de `backend/` normalmente no seu editor
- O container já está com hot-reload (`npm run start:dev`), então as mudanças
  aparecem automaticamente, sem precisar reiniciar o Docker
- Só precisa rodar `docker compose up -d` de novo se mudar o `docker-compose.yml`,
  o `Dockerfile`, ou instalar uma dependência nova (`package.json`)

## Quando for para produção

Nada no código muda — só o `.env`:
- `DATABASE_URL` aponta para o Postgres gerenciado (RDS, Supabase, etc.)
- `REDIS_HOST` aponta para o Redis gerenciado (Upstash, ElastiCache, etc.)
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` apontam para o R2/S3 real

O MinIO existe só para o ambiente local — em produção ele simplesmente não é usado.
