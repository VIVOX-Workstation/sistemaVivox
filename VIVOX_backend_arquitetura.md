# VIVOX — Arquitetura de Backend (foco em escalabilidade)

## Contexto

O VIVOX não é só o módulo Clientes — vai crescer para vários módulos compartilhando a mesma base: **Clientes, Analytics, Revisão, Educacional, Roteirista, Studio, Film, GP**. A decisão de backend precisa considerar isso desde o início, mesmo que a implementação comece pequena.

---

## Recomendação: monólito modular → pronto para separar depois

Não começar com microsserviços — complexidade operacional (deploy, rede, observabilidade distribuída) desnecessária nesta fase. O caminho recomendado é um **monólito modular bem desenhado**: cada módulo VIVOX isolado internamente (schema próprio, sem acoplamento direto entre módulos), comunicando-se por eventos. Assim, quando o sistema crescer, dá para extrair um módulo inteiro como serviço separado sem reescrever tudo.

---

## Stack recomendada

| Camada | Escolha | Por que ajuda a escalar |
|---|---|---|
| Backend | **NestJS** (Node/TypeScript), organizado em módulos por domínio (clientes, servicos, producoes...) | Fronteiras claras entre módulos facilitam separar em microsserviço depois, se necessário. Mesma linguagem do frontend (React/TS) |
| Banco de dados | **PostgreSQL**, com schema por domínio + índices desde o início | Aguenta bastante escala vertical; quando não bastar, dá pra usar read replicas para leitura pesada (dashboards do Analytics, por exemplo) |
| ORM | **Prisma** | Migrations simples, typesafe, boa produtividade |
| Cache | **Redis** | Cache de queries pesadas (relatórios do Analytics) e sessão |
| Fila / eventos | **BullMQ (Redis) no início → RabbitMQ ou Kafka se o volume crescer** | Comunicação assíncrona entre módulos (ex: "produção aprovada" dispara atualização no Analytics) sem acoplar os módulos diretamente |
| Arquivos/mídia | **S3 ou Cloudflare R2 + CDN na frente** | Fotos, vídeos, folders, revistas — nunca armazenar binário no banco; CDN tira carga do backend |
| Autenticação | **JWT próprio ou serviço gerenciado (Clerk/Auth0)** | SSO único compartilhado entre todos os módulos VIVOX |
| Deploy | **Docker** desde o dia 1, mesmo rodando em uma única máquina no início | Migrar para Kubernetes/ECS depois vira configuração, não reescrita |
| Observabilidade | **Logs estruturados + métricas desde o MVP** (ex: Grafana/Loki ou serviço gerenciado) | Sem isso, o gargalo de escala só aparece quando já é problema em produção |

---

## Visão da arquitetura

```
Apps frontend (React) — Clientes, Analytics, Studio...
                │
                ▼
┌─────────────────────────────────────────────────┐
│           Backend modular (NestJS)               │
│                                                    │
│  ┌───────────┐   ┌───────────┐   ┌─────────────┐ │
│  │ Clientes  │   │ Analytics │   │ Outros       │ │
│  │ Serviços  │   │ Resultados│   │ módulos      │ │
│  │ e histórico│  │           │   │ (Revisão,    │ │
│  │           │   │           │   │ Studio, GP)  │ │
│  └─────┬─────┘   └─────┬─────┘   └──────┬───────┘ │
│        └───────────────┴────────────────┘         │
│               Fila de eventos                      │
└─────────────────────────┬──────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌───────────┐      ┌───────────┐      ┌─────────────┐
  │ PostgreSQL│      │  Redis    │      │  S3 / R2    │
  │ Dados     │      │ Cache e   │      │  + CDN      │
  │ relacionais│     │ sessão    │      │ Fotos, vídeos│
  └───────────┘      └───────────┘      └─────────────┘
```

Cada módulo (Clientes, Analytics, Revisão, Studio, GP...) fala com os outros **via fila de eventos**, não por chamada direta — isso é o que permite extrair um módulo como serviço independente no futuro sem reescrever o resto do sistema.

---

## Roteiro de crescimento

1. **Agora (poucos usuários, validando)**
   Monólito modular único, um Postgres, um Redis, tudo em um container/VM. Já com fila de eventos entre módulos desde o início — é o que evita reescrita depois.

2. **Quando o uso crescer** (mais clientes, mais mídia, mais módulos ativos)
   - Read replica no Postgres para separar leitura pesada
   - CDN na frente do storage de mídia
   - Backend escalando horizontalmente (múltiplas instâncias atrás de um load balancer, já que é stateless)

3. **Se um módulo específico crescer muito** (ex: VIVOX FILM processando vídeo pesado)
   Esse módulo vira serviço separado, continua escutando a mesma fila de eventos, escala de forma independente dos outros módulos — sem precisar reescrever o restante do sistema.

---

## Ponto-chave

O que garante escalabilidade não é a tecnologia isolada, é **desenhar os módulos desacoplados desde o dia 1** — comunicação por eventos, não chamada direta entre módulos. Isso é o que dá a opção de separar peças depois, sem dor.

---

## Alternativa mais rápida (se a prioridade fosse validar rápido)

Se em algum momento a prioridade for validar rapidamente em vez de já construir para escala, **Supabase** (Postgres + Auth + Storage + API gerenciados) permite começar a codar telas no mesmo dia, com o risco de precisar migrar para backend próprio conforme integrações externas (Reportei, Bitrix, plugin do Premiere) exigirem lógica customizada. Dado o objetivo atual de foco em escalabilidade, a rota recomendada continua sendo NestJS + PostgreSQL + Redis + fila de eventos.
