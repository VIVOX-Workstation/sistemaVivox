# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
ARG VITE_API_URL=https://api.vivoxmarketing.com.br
ARG VITE_EXCALIDRAW_WS_URL=https://quadro.vivoxmarketing.com.br
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EXCALIDRAW_WS_URL=$VITE_EXCALIDRAW_WS_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
