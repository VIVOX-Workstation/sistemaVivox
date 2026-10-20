# Sistema VIVOX (VIVOX Flow)

Sistema interno da agência VIVOX: clientes, propostas, serviços e planejamento,
**Demandas gerais** (Kanban da equipe), Minhas tarefas, Chamados, Acompanhamento
de publicações, Analytics, Hospedagens, Educacional, portal do cliente e
assistente com IA.

Este README foi escrito para quem **não é programador** e vai fazer alterações
no sistema com ajuda do Claude (Claude Code). Siga os passos na ordem.

---

## 1. Por onde entender o sistema

| Leia | Para saber |
|---|---|
| [`docs/CEREBRO.md`](docs/CEREBRO.md) | **Comece aqui.** Todas as seções, os dados que elas compartilham e como uma alimenta a outra |
| [`docs/secoes/`](docs/secoes/README.md) | Uma ficha por seção: como funciona, onde está o código, com quem conversa, o que falta e o histórico de mudanças |
| [`docs/MEMORIA_DO_SISTEMA.md`](docs/MEMORIA_DO_SISTEMA.md) | Papéis e permissões, onde mora cada dado, armadilhas conhecidas |
| [`docs/CRUZAMENTO_TELAS_DADOS.md`](docs/CRUZAMENTO_TELAS_DADOS.md) | Cada tela, campo a campo, e de onde vem o dado |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Visual e componentes |
| [`AGENTS.md`](AGENTS.md) | Regras de trabalho para pessoas e IAs |
| [`VVOX_SYNC.md`](VVOX_SYNC.md) | Detalhes técnicos do Kanban de Demandas gerais |

**Toda mudança termina com uma linha no registro da ficha da seção.** Se mexe em
mais de uma seção, vale para cada uma e para o cérebro.

---

## 2. Como o projeto está organizado

```
SistemaVivox/                  ← pasta principal do projeto
├── backend/                   ← o "servidor" (API NestJS + banco PostgreSQL via Prisma)
│   └── src/<modulo>/          ← um módulo por assunto (clientes, kanban, chamados…)
├── vivox-clientes/            ← o "front": as telas que você vê no navegador
│   ├── src/pages/             ← páginas inteiras
│   ├── src/components/        ← peças das telas
│   ├── src/features/          ← seções maiores (kanban, propostas)
│   └── public/kanban/         ← o Kanban de Demandas gerais (HTML/JS, aberto dentro da página)
├── docs/                      ← documentação (cérebro, fichas das seções, memória)
├── docker-compose.yml         ← liga o backend, banco de dados etc.
└── README.md                  ← este arquivo
```

**Regra prática:** mudança visual / de tela = pasta `vivox-clientes`.
Mudança em regra de negócio ou no que é salvo no banco = pasta `backend`.
Se não souber, peça ao Claude: *"onde fica isso?"*, ou abra a ficha da seção em
`docs/secoes/`: a tabela "Onde fica" lista os arquivos.

### Seções e endereços

| Seção | Endereço | Ficha |
|---|---|---|
| Dashboard | `/` | [dashboard](docs/secoes/dashboard.md) |
| Clientes e Propostas | `/clientes`, `/cliente/:id` | [clientes](docs/secoes/clientes.md), [propostas](docs/secoes/propostas.md) |
| Serviços e Planejamento | `/cliente/:id/servicos/:sid/planejamento` | [servicos-e-planejamento](docs/secoes/servicos-e-planejamento.md) |
| Hospedagens | `/hospedagens` | [hospedagens](docs/secoes/hospedagens.md) |
| Analytics | `/analytics` | [analytics](docs/secoes/analytics.md) |
| Acompanhamento | `/acompanhamento` | [acompanhamento](docs/secoes/acompanhamento.md) |
| Demandas gerais | `/demandasgerais/(nome-do-quadro)` | [demandas-gerais](docs/secoes/demandas-gerais.md) |
| Minhas tarefas | `/gp/minhas-tarefas` | [minhas-tarefas](docs/secoes/minhas-tarefas.md) |
| Chamados | `/gp/workspace/all` | [chamados](docs/secoes/chamados.md) |
| Educacional | `/educacional` | [educacional](docs/secoes/educacional.md) |
| Configurações | `/configuracoes` | [acesso-e-equipe](docs/secoes/acesso-e-equipe.md) |
| Portal do cliente | `/portal` | [portal-do-cliente](docs/secoes/portal-do-cliente.md) |

---

## 3. Programas que precisam estar instalados (uma vez só)

1. **Node.js** (versão 20 ou mais nova) — https://nodejs.org (baixe a versão "LTS")
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop
   (precisa estar **aberto** sempre que for rodar o sistema)
3. **Git** — https://git-scm.com
4. **Claude Code**

Para conferir se o Node está instalado, abra o terminal e digite `node -v`.
Deve aparecer algo como `v20.x.x`.

---

## 4. Subir o sistema para testar (todo dia)

São **dois terminais** abertos ao mesmo tempo: um para o backend e outro para o front.

### Passo 1 — Backend (servidor + banco de dados)

Abra o **Docker Desktop** e espere ele terminar de iniciar. Depois, num terminal,
**na pasta principal `SistemaVivox`**, rode:

```bash
docker compose up -d
```

Na primeira vez demora alguns minutos. Na primeira vez também é preciso ter o
arquivo `.env` na pasta principal (se não existir, rode `cp .env.example .env`
ou peça ao responsável técnico).

### Passo 2 — Front (as telas)

> ⚠️ **O `npm run dev` precisa ser rodado DENTRO da pasta `vivox-clientes`**,
> não na pasta principal. Se rodar na pasta errada, vai dar erro.

Num **segundo terminal**:

```bash
cd vivox-clientes
npm install        # só na primeira vez, ou quando o Claude avisar que instalou algo novo
npm run dev
```

Caminho completo da pasta, para referência:
`C:\Users\<seu-usuario>\Desktop\Projetos\SistemaVivox\vivox-clientes`

Quando aparecer algo como `Local: http://localhost:5173/`, abra esse endereço
no navegador. Deixe esse terminal aberto — fechar ele desliga o front.

Toda alteração salva nos arquivos aparece **sozinha** no navegador (não precisa
reiniciar nada).

### Para desligar

- Front: no terminal do `npm run dev`, aperte `Ctrl + C`
- Backend: na pasta principal, rode `docker compose down`

---

## 5. Como pedir alterações ao Claude

Abra o Claude Code **na pasta principal `SistemaVivox`** (não dentro de `vivox-clientes`).

Dicas para pedidos que dão certo:

- **Seja específico sobre a tela:** *"Em Demandas gerais, quero que o cartão
  da tarefa mostre a data de entrega em vermelho quando estiver atrasada."*
- **Uma mudança por vez.** Teste no navegador antes de pedir a próxima.
- **Mande print** da tela quando for algo visual (pode arrastar a imagem para o Claude).
- **Se algo quebrou**, copie a mensagem de erro (do terminal ou do navegador) e
  cole para o Claude: *"apareceu esse erro: ..."*
- Peça para ele **explicar antes de mudar**, se tiver dúvida:
  *"Me explica o que você vai alterar antes de fazer."*

### Salvando o trabalho (Git)

Nunca trabalhe direto na branch `main`. Peça ao Claude:

1. Antes de começar: *"Cria uma branch nova para essa alteração em Demandas gerais."*
2. Quando terminar e testar: *"Registra na ficha da seção e faz o commit dessas mudanças."*
3. Para enviar para revisão: *"Abre um PR."*

O responsável técnico revisa o PR antes de ir para o ar. **Nada vai para
produção sozinho** — então pode testar sem medo.

---

## 6. Problemas comuns

| Problema | Solução |
|---|---|
| `npm run dev` dá erro "Missing script: dev" ou "package.json not found" | Você está na pasta errada. Rode `cd vivox-clientes` antes. |
| A tela abre, mas não carrega dados / dá erro de login | O backend não está rodando. Abra o Docker Desktop e rode `docker compose up -d` na pasta principal. |
| Erro "Cannot find module ..." | Rode `npm install` dentro de `vivox-clientes`. |
| Porta 5173 ocupada | Já tem um `npm run dev` aberto em outro terminal. Use ele ou feche com `Ctrl + C`. |
| Qualquer outra coisa | Copie o erro e cole para o Claude. |

---

## 7. Referência técnica (para desenvolvedores)

### Serviços do `docker compose up -d`

- **backend** — API NestJS com hot-reload (`npm run start:dev`)
- **postgres** — banco de dados
- **redis** — está no Docker, mas o sistema ainda não usa
- **minio** — storage local compatível com S3 (substitui S3/R2 no dev)

| Serviço | URL |
|---|---|
| Front (Vite) | http://localhost:5173 |
| API do backend | http://localhost:3000 |
| Console do MinIO | http://localhost:9001 (login: `vivox` / senha: `vivox12345`) |
| Postgres | `localhost:5432`, banco `vivox`, usuário `vivox`, senha `vivox` |

Comandos úteis:

```bash
docker compose ps                 # ver o que está rodando
docker compose logs -f backend    # logs do backend em tempo real
docker compose down -v            # parar e APAGAR os dados locais (recomeça do zero)
```

O front em `localhost` aponta automaticamente para a API em `http://localhost:3000`
(ver `vivox-clientes/src/api/client.ts`). Para apontar para outra API, defina
`VITE_API_URL` em `vivox-clientes/.env`.

Só é preciso rodar `docker compose up -d` de novo se mudar o `docker-compose.yml`,
o `Dockerfile` ou as dependências do backend (`package.json`).

### Produção

Produção roda em VPS via Coolify. Nada no código muda — só as variáveis de ambiente
(`DATABASE_URL`, `REDIS_HOST`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`).
O MinIO existe só para o ambiente local.
