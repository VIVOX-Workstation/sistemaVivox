FROM node:22-slim

# Instalar dependências essenciais
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copiar os arquivos de pacote
COPY backend/package*.json ./

# Instalar as dependências (incluindo devDependencies necessárias pro build)
RUN npm install --include=dev

# Copiar todo o código do backend
COPY backend/ .

# Gera o Prisma Client com os tipos corretos (Isso resolve o erro TypeScript)
RUN ./node_modules/.bin/prisma generate

# Faz o build de produção do NestJS (Gera a pasta dist)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

EXPOSE 3000

# HOTFIX TEMPORÁRIO (remover após o próximo deploy bem-sucedido): baseline de produção.
# O banco de produção já tinha todo o schema (anos rodando com `prisma db push`), mas a
# tabela _prisma_migrations nunca foi populada. `migrate deploy` sozinho falhava com P3005
# ("schema is not empty") e derrubava o container em loop. Este CMD marca as migrations
# pré-existentes como já aplicadas (idempotente via `|| true`) antes de rodar migrate deploy
# normalmente. Depois de confirmado que subiu limpo, reverter para a linha original abaixo:
# CMD ["/bin/sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/main"]
CMD ["/bin/sh", "-c", "for m in 20260804220925_init_clientes_analytics 20260818154500_regulariza_schema_e_vetores 20260819161517_add_openpanel_project_id 20260825225200_sync_drift 20260825225357_add_educacional_module 20260825231902_add_aula_capa 20260825235248_add_curso_capa_pos 20260826014828_add_chamado_fields 20260826021935_add_chamado_sla 20260831001052_add_quadro_sala 20260831021408_simplify_quadro_sala 20260910103200_add_tarefa_origem_bitrix_id 20260910121554_add_tarefa_observadores_e_log_sistema 20260916000001_add_instagram_facebook_oauth_to_cliente 20260916000002_add_meta_auth_method; do ./node_modules/.bin/prisma migrate resolve --applied $m || true; done && ./node_modules/.bin/prisma migrate deploy && node dist/src/main"]
