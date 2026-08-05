FROM node:20-slim

# Instalar dependências essenciais que o Prisma possa precisar no debian
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
