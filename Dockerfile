FROM node:20-slim

# Instalar dependências essenciais
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copiar os arquivos de pacote
COPY backend/package*.json ./

# Instalar as dependências
RUN npm install

# Copiar todo o código do backend
COPY backend/ .

# Gera o Prisma Client com os tipos corretos (Isso resolve o erro TypeScript)
RUN npx prisma generate

# Faz o build de produção do NestJS (Gera a pasta dist)
RUN npm run build

EXPOSE 3000

# Inicia o app: Primeiro envia as tabelas pro banco (db push) e depois liga o sistema de produção
CMD ["/bin/sh", "-c", "npx prisma db push && node dist/src/main"]
