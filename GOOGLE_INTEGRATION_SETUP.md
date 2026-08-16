# 🚀 Guia de Configuração: Google Analytics 4 (GA4) & Google Search Console (GSC)

Este guia orienta passo a passo como habilitar as APIs do Google, criar uma **Conta de Serviço (Google Cloud Service Account)** e conectar as propriedades dos clientes ao **Sistema Vivox**.

---

## 📌 Visão Geral do Funcionamento

O Sistema Vivox utiliza o modelo **Multi-Cliente com Conta de Serviço Centralizada**:
- Você cria **uma única Conta de Serviço** no Google Cloud.
- O e-mail dessa conta de serviço (ex: `vivox-analytics@seu-projeto.iam.gserviceaccount.com`) é adicionado como **Leitor** nas propriedades do GA4 e do Search Console.
- No Sistema Vivox, você só precisa cadastrar o **ID da Propriedade GA4** e a **URL do Site no Search Console** de cada cliente.

---

## 🔹 Passo 1: Criar Projeto e Ativar APIs no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo da tela, clique no seletor de projetos e crie um **Novo Projeto** (ex: `Vivox Analytics`).
3. Vá no menu lateral ➔ **APIs e Serviços** ➔ **Biblioteca** (*Library*).
4. Pesquise e clique no botão **Ativar** para cada uma das seguintes APIs:
   - **Google Analytics Data API** (necessária para consultar métricas do GA4).
   - **Google Search Console API** (necessária para consultar cliques, impressões e posições de SEO).

---

## 🔹 Passo 2: Criar a Conta de Serviço (Service Account)

1. No Google Cloud Console, acesse **IAM e Administrador** ➔ **Contas de Serviço** (*Service Accounts*).
2. Clique em **+ Criar Conta de Serviço**.
3. Preencha:
   - **Nome da conta de serviço:** `vivox-analytics-reader`
   - **ID da conta de serviço:** `vivox-analytics-reader`
   - **Descrição:** `Leitura de dados do GA4 e Search Console para o Sistema Vivox`
4. Clique em **Criar e Continuar**.
5. Na etapa de papéis (roles), pode deixar em branco ou selecionar `Leitor / Viewer` (as permissões reais serão concedidas dentro do GA4 e do Search Console).
6. Clique em **Concluir**.

---

## 🔹 Passo 3: Gerar e Baixar a Chave JSON da Service Account

1. Na lista de Contas de Serviço, clique no e-mail da conta que você acabou de criar.
2. Acesse a aba **Chaves** (*Keys*).
3. Clique em **Adicionar Chave** ➔ **Criar nova chave**.
4. Selecione o formato **JSON** e clique em **Criar**.
5. Um arquivo `.json` será baixado no seu computador. Guarde-o em local seguro!

---

## 🔹 Passo 4: Configurar as Variáveis no Backend do Sistema Vivox

Abra o arquivo `.env` da pasta `backend/` (ou crie a partir de `.env.example`) e configure as credenciais. Você tem 3 opções:

### Opção A: Variáveis Individuais (Recomendado para servidores e Docker)
Abra o arquivo `.json` baixado e copie os campos:
```env
GOOGLE_CLIENT_EMAIL="vivox-analytics-reader@seu-projeto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID="seu-projeto"
```
*(Nota: O backend trata automaticamente as quebras de linha `\n` da chave privada).*

### Opção B: Arquivo local
Copie o arquivo `.json` baixado para a pasta `backend/` com o nome `credentials.json` (ou `google-credentials.json`), ou defina:
```env
GOOGLE_APPLICATION_CREDENTIALS="credentials.json"
```

### Opção C: JSON em string única
```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

---

## 🔹 Passo 5: Conceder Acesso no Google Analytics 4 (GA4)

### Cenário 1: Todas as propriedades estão em uma única conta Google da agência (Mais rápido!)
1. Acesse o [Google Analytics](https://analytics.google.com/).
2. Clique na engrenagem de **Administrador** (canto inferior esquerdo).
3. Na coluna **Conta**, clique em **Gerenciamento de Acesso à Conta**.
4. Clique no botão **+** (canto superior direito) ➔ **Adicionar usuários**.
5. Digite o e-mail da sua Service Account (ex: `vivox-analytics-reader@seu-projeto.iam.gserviceaccount.com`).
6. Marque a função de **Leitor (Viewer)** e clique em **Adicionar**.
7. Pronto! A Service Account agora tem acesso a **todas as propriedades de todos os clientes** dessa conta!

### Cenário 2: Propriedade individual de um cliente externo
1. No GA4, selecione a propriedade do cliente.
2. Vá em **Administrador** ➔ **Gerenciamento de Acesso à Propriedade**.
3. Adicione o e-mail da Service Account como **Leitor (Viewer)**.

> 💡 **Como pegar o ID da Propriedade:**
> No GA4, em **Administrador ➔ Detalhes da Propriedade**, copie o **ID DA PROPRIEDADE** numérico (ex: `481928472`).

---

## 🔹 Passo 6: Conceder Acesso no Google Search Console

1. Acesse o [Google Search Console](https://search.google.com/search-console).
2. Selecione a propriedade do site do cliente no menu superior esquerdo.
3. No menu lateral esquerdo, clique em **Configurações** (engrenagem).
4. Clique em **Usuários e permissões**.
5. Clique em **Adicionar usuário**.
6. Insira o e-mail da Service Account e selecione a permissão **Total** ou **Restrita** (ambas permitem leitura de dados).
7. Clique em **Adicionar**.

> 💡 **Como pegar a URL do Site no Search Console:**
> Use o formato exato que aparece no seletor de propriedades do Search Console:
> - Se for Prefixo de URL: `https://www.cliente.com.br/` (com `https://` e barra no final).
> - Se for Propriedade de Domínio: `sc-domain:cliente.com.br`.

---

## 🔹 Passo 7: Vincular no Sistema Vivox

1. No Sistema Vivox, acesse o cliente desejado.
2. Vá na aba **Analytics** ou **Visão Geral** e clique em **Configurar IDs** (ou preencha no formulário de cadastro do cliente).
3. Preencha:
   - **ID da Propriedade GA4:** `481928472`
   - **Site URL no Search Console:** `https://www.cliente.com.br/`
4. Clique em **Salvar Configuração**.
5. As métricas de tráfego, audiência, canais, eventos e o ranking de palavras-chave de SEO serão carregados e exibidos instantaneamente! 🎉
