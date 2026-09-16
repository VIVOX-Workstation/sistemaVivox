# Pendências de Infraestrutura (Produção)

## Integração OAuth - Meta (Instagram/Facebook)
*Aguardando PR do Alicerce ser mergeada*

Quando a feature for para produção, é **obrigatório** realizar os seguintes passos via painel/API do **Coolify** (NÃO alterar o `docker-compose.prod.yml` diretamente na VPS):

1. **Variáveis de Ambiente (Backend - Coolify):**
   - Configurar `META_REDIRECT_URI` apontando para o endpoint público em produção (ex: `https://api.vivoxmarketing.com.br/auth/instagram/callback`).
   - Configurar `FRONTEND_URL` apontando para o domínio do app (ex: `https://flow.vivoxmarketing.com.br`).

2. **Console de Desenvolvedor da Meta (App ID: 1632933335171736):**
   - Acessar as configurações de Login do Facebook.
   - Adicionar a URL de produção exata à lista de **Valid OAuth Redirect URIs** (ex: `https://api.vivoxmarketing.com.br/auth/instagram/callback`).
   - Garantir que a URL de desenvolvimento (`http://localhost:3000/auth/instagram/callback`) também esteja lá, se necessário para testes locais.
