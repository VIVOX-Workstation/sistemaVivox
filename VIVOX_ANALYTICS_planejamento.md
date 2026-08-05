# VIVOX ANALYTICS — Documento de Planejamento

## 1. Objetivo do módulo

Mostrar, por cliente, **o que a Vivox já entrega**, **como esses serviços estão performando** e **o que ainda dá para vender**. É o módulo que transforma dados espalhados (Reportei, Google Meu Negócio, produções internas) em decisão: renovar, ajustar estratégia, ou oferecer novo serviço.

O módulo tem 4 partes, que veremos como abas dentro do perfil do cliente (reaproveitando o mesmo cliente cadastrado no VIVOX CLIENTES):

1. **Painel do Cliente** — nome + mockup dos serviços contratados
2. **Resultados** — avaliação de desempenho do que foi produzido
3. **Oportunidades** — serviços que o cliente ainda não tem
4. **Agendamento de reunião**

---

## 2. Parte 1 — Painel do Cliente

Visão rápida, tipo "cartão de visita" do cliente dentro do Analytics: nome, logo, e um **mockup visual** mostrando quais serviços da Vivox ele já tem contratado.

### Como representar visualmente
Um conjunto de ícones/blocos (um por tipo de serviço: Gerenciamento de redes, Folder, Revista, Landing Page, App, Fotografia, Vídeo, Tráfego pago, Identidade visual) — **ativo** (colorido/preenchido) vs **não contratado** (esmaecido/contorno). Isso já entrega, num olhar de 2 segundos, "o que esse cliente tem e o que não tem" — e conecta direto com a Parte 3 (Oportunidades).

### De onde vem o dado
Puxa direto da tabela `servicos_contratados` do VIVOX CLIENTES (não duplica cadastro — o Analytics **lê** o que o Clientes já tem).

---

## 3. Parte 2 — Resultados (avaliação de desempenho)

A parte mais rica em dado. Três sub-blocos:

### 3.1 Posts e vídeos publicados
- Lista de conteúdo publicado no período (puxado do **Reportei** via API/integração)
- Métricas por post: alcance, engajamento (curtidas, comentários, compartilhamentos), tipo de conteúdo (reels, carrossel, estático, story)
- **Melhores engajamentos**: ranking automático dos posts com melhor performance no período
- **Avaliação de padrão do que deu certo**: análise agregada — que tipo de conteúdo, horário, formato ou tema teve melhor resultado consistentemente (ex: "posts com vídeo têm 3x mais engajamento que estáticos nesse cliente")

### 3.2 Avaliação Google Meu Negócio (GMB)
- Nota média atual e histórico de evolução
- Volume de avaliações novas no período
- Avaliações negativas sem resposta (alerta)
- Tempo médio de resposta da equipe

### 3.3 Visão consolidada
- Um resumo do período (mês/trimestre) que a equipe pode usar direto numa reunião com o cliente

---

## 4. Parte 3 — Oportunidades

Compara `servicos_contratados` (o que o cliente tem) com o catálogo completo de serviços da Vivox → gera automaticamente a lista do que falta.

- Pode vir com uma "razão sugerida" simples (ex: "cliente tem alto engajamento em posts mas não tem tráfego pago contratado — potencial de investir em mídia paga")
- Serve de gancho direto pra reunião comercial

---

## 5. Parte 4 — Agendamento de reunião

- Botão para marcar reunião com o cliente direto do perfil (integração com Google Calendar)
- Histórico de reuniões passadas (data, quem participou, resumo/observação)

---

## 6. Modelo de dados

### 6.1 `analytics_snapshot` (dado agregado por período, por cliente)
| Campo | Tipo |
|---|---|
| id | UUID |
| cliente_id | referência |
| periodo_inicio / periodo_fim | data |
| origem | enum (reportei, manual) |
| alcance_total | número |
| engajamento_total | número |
| nota_gmb | número |
| avaliacoes_gmb_periodo | número |

### 6.2 `publicacoes` (post/vídeo individual)
| Campo | Tipo |
|---|---|
| id | UUID |
| cliente_id | referência |
| producao_relacionada_id | referência (liga ao VIVOX CLIENTES → `producoes`) |
| tipo | enum (post, reels, carrossel, story, video) |
| data_publicacao | data |
| alcance / curtidas / comentarios / compartilhamentos | números |
| origem_dado | enum (reportei_api, manual) |

### 6.3 `avaliacoes_gmb`
| Campo | Tipo |
|---|---|
| id | UUID |
| cliente_id | referência |
| nota | número (1-5) |
| comentario | texto |
| data | data |
| respondida | booleano |
| data_resposta | data, opcional |

### 6.4 `oportunidades` (pode ser calculado on-the-fly, ou persistido para histórico)
| Campo | Tipo |
|---|---|
| id | UUID |
| cliente_id | referência |
| servico_sugerido | enum (mesmo enum de tipo_servico do Clientes) |
| justificativa | texto |
| status | enum (aberta, apresentada, aceita, recusada) |

### 6.5 `reunioes`
| Campo | Tipo |
|---|---|
| id | UUID |
| cliente_id | referência |
| data_hora | datetime |
| participantes | array de texto |
| resumo | texto, opcional (preenchido depois) |
| status | enum (agendada, realizada, cancelada) |

---

## 7. Integração com o Reportei

O Reportei já centraliza dados de redes sociais — o Analytics não deve recoletar isso na mão, e sim **sincronizar**.

**Fluxo recomendado**:
1. Job assíncrono (via fila — BullMQ, que já está na arquitetura do backend) roda periodicamente (ex: diário) e busca dados novos na API do Reportei para cada cliente
2. Os dados chegam brutos, são normalizados e salvos em `publicacoes` e `analytics_snapshot`
3. O restante do módulo (rankings, "avaliação de padrão", oportunidades) trabalha em cima do dado já salvo no Postgres — não faz chamada à API do Reportei em tempo real na tela do usuário

> Antes de implementar: confirmar se o Reportei tem API pública documentada ou se o acesso é só via exportação/relatório — isso muda se a sincronização é automática (API) ou semi-manual (importação de CSV/relatório periodicamente).

Para o Google Meu Negócio, o caminho equivalente é a **Google Business Profile API**, que exige verificação de propriedade da conta do cliente (ou permissão delegada) — vale mapear isso com a equipe antes de prometer sincronização automática.

---

## 8. Telas / Fluxo

1. **Seletor de cliente** (pode reaproveitar a mesma lista do VIVOX CLIENTES)
2. **Perfil Analytics do cliente**, com abas:
   - **Painel do Cliente**: mockup dos serviços contratados
   - **Resultados**: posts/vídeos, ranking de engajamento, padrão identificado, avaliação GMB
   - **Oportunidades**: lista de serviços sugeridos
   - **Reuniões**: agendar nova + histórico

---

## 9. MVP vs Fase 2

### MVP
- [ ] Painel do Cliente (mockup dos serviços, lendo do VIVOX CLIENTES)
- [ ] Listagem de publicações com métricas (mesmo que a sincronização com Reportei comece manual/importação)
- [ ] Ranking simples de melhores engajamentos
- [ ] Lista de oportunidades (comparação automática de serviços)
- [ ] Agendamento de reunião básico (sem integração de calendário ainda, só registro)

### Fase 2
- [ ] Sincronização automática via API do Reportei (job agendado)
- [ ] Integração com Google Business Profile API (GMB automático)
- [ ] "Avaliação de padrão do que deu certo" com análise mais robusta (ex: agrupar por tipo/horário/formato automaticamente)
- [ ] Integração real com Google Calendar para agendamento

---

## 10. Próximos passos sugeridos

1. Validar o nome "Painel do Cliente" pra Parte 1 (ou trocar)
2. Confirmar acesso à API do Reportei (documentação/credenciais) — isso define se o MVP já nasce automático ou começa manual
3. Definir o catálogo oficial de serviços da Vivox (a lista que "Oportunidades" vai comparar) — hoje temos: gerenciamento de redes, folder, revista, LP, app, fotografia, vídeo, tráfego pago, identidade visual — confirmar se está completo
