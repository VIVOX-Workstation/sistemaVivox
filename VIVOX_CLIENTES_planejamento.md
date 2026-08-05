# VIVOX CLIENTES — Documento de Planejamento

## 1. Objetivo do módulo

Ser a **base central de informações de cada cliente** da agência: quem é, o que já foi produzido para ele, quais serviços tem contratados e qual o histórico de entrega. Os demais módulos do sistema VIVOX (Analytics, Revisão, Studio, GP) devem consultar/alimentar este cadastro, evitando retrabalho e informação espalhada.

---

## 2. Estrutura de dados (entidades principais)

### 2.1 Cliente (`clientes`)
| Campo | Tipo | Observação |
|---|---|---|
| id | UUID | chave primária |
| nome_fantasia | texto | |
| razao_social | texto | opcional |
| cnpj_cpf | texto | |
| segmento | texto | ex: estética, food service, varejo |
| responsavel_interno | referência (usuário) | quem na Vivox atende o cliente |
| contatos | lista (nome, cargo, telefone, e-mail, whatsapp) | pode ter mais de um contato |
| status | enum | ativo / pausado / encerrado / prospect |
| data_inicio_contrato | data | |
| data_fim_contrato | data | nulo se contínuo |
| logo / identidade visual | arquivo | |
| observações internas | texto longo | notas da equipe |

### 2.2 Serviços contratados + histórico (`servicos_contratados`) — **prioridade desta fase**
| Campo | Tipo | Observação |
|---|---|---|
| id | UUID | |
| cliente_id | referência | |
| tipo_servico | enum | Gerenciamento de redes, Folder, Revista, Landing Page, App, Fotografia, Vídeo, Tráfego pago, Identidade visual... |
| status | enum | ativo / concluído / pausado / cancelado |
| data_contratacao | data | |
| data_entrega / renovação | data | |
| valor / plano | texto ou número | opcional, se o módulo tiver essa permissão |
| descrição do escopo | texto | o que exatamente foi acordado |
| histórico de alterações | log (data, usuário, ação) | ex: "escopo ampliado", "renovado", "pausado por falta de pagamento" |

> Isso permite responder, com um clique: **"O que esse cliente já contratou, quando, e o que mudou ao longo do tempo?"** — e alimenta diretamente o módulo VIVOX ANALYTICS na parte de "Oportunidades" (serviços que ele NÃO tem ainda).

### 2.3 Materiais produzidos (`producoes`)
| Campo | Tipo | Observação |
|---|---|---|
| id | UUID | |
| cliente_id | referência | |
| servico_relacionado_id | referência | liga à entrega de um serviço contratado |
| tipo | enum | post, vídeo, folder, revista, LP, app, foto |
| arquivo/link | arquivo ou URL | preview + link do material final |
| data_producao | data | |
| responsável | referência (usuário/equipe) | quem produziu |
| status | enum | em produção / em revisão / aprovado / publicado |

### 2.4 Galeria de fotos (`midias_cliente`)
- Fotos do cliente (loja, produto, equipe, eventos) usadas como banco de imagens para produção.
- Tags (ex: "fachada", "produto X", "evento Y") para facilitar busca por quem for criar conteúdo.

---

## 3. Telas / Fluxo do módulo

1. **Lista de clientes** — busca, filtro por status/segmento/responsável, cards com logo + status.
2. **Perfil do cliente** (tela principal), com abas:
   - **Visão geral**: dados cadastrais, contatos, responsável interno.
   - **Serviços & histórico**: linha do tempo dos serviços contratados, com filtro por status e tipo.
   - **Produções**: galeria do que foi feito (posts, vídeos, folders, LPs), com preview.
   - **Mídias/fotos**: banco de imagens do cliente.
   - **Observações**: notas internas da equipe.
3. **Cadastro/edição de cliente** — formulário.
4. **Adicionar serviço contratado** — formulário rápido (tipo, escopo, datas).
5. **Timeline de histórico** — log cronológico de tudo que aconteceu com o cliente (contratações, entregas, renovações, cancelamentos).

---

## 4. Funcionalidades da primeira versão (MVP)

- [ ] Cadastro completo de cliente (dados + contatos)
- [ ] Cadastro de serviços contratados com status e histórico de alterações
- [ ] Upload/organização de materiais produzidos por cliente
- [ ] Upload/organização de banco de fotos por cliente
- [ ] Busca e filtros (por nome, status, serviço, responsável)
- [ ] Timeline/histórico visível por cliente
- [ ] Permissões básicas (quem pode ver valores, quem só vê produção)

### Fase 2 (integração com outros módulos)
- [ ] Puxar dados de resultado (engajamento, GMB) do VIVOX ANALYTICS direto no perfil do cliente
- [ ] Sinalizar "oportunidades" (serviços não contratados) automaticamente no perfil
- [ ] Botão de agendar reunião direto do perfil do cliente

---

## 5. Sugestão de stack (sistema web completo)

- **Frontend**: React (componentizado — cada aba do perfil do cliente como componente separado, reaproveitável nos outros módulos VIVOX)
- **Backend**: Node.js (API REST) ou Python (FastAPI) — depende do que a equipe já domina
- **Banco de dados**: PostgreSQL (relacional, bom pra esse tipo de dado com relações claras entre cliente → serviços → produções)
- **Armazenamento de arquivos**: bucket (S3 ou equivalente) para fotos/vídeos/materiais
- **Autenticação**: login único (SSO) pensando que o VIVOX vai ter vários módulos (Clientes, Analytics, Revisão, etc.) — usuário loga uma vez e acessa tudo

---

## 6. Próximos passos sugeridos

1. Validar esse modelo de dados com você (campos faltando? algo sobrando?)
2. Desenhar as telas (posso gerar um mockup navegável)
3. Definir prioridade: **Serviços contratados + histórico** primeiro (conforme você definiu), depois cadastro geral, depois produções/fotos
4. Escolher stack definitiva e iniciar estrutura do banco de dados

---

**Pergunta em aberto para next step:** quer que eu já modele o schema de banco de dados (tabelas e relações em SQL) focado em `servicos_contratados`, ou prefere primeiro validar/ajustar os campos deste documento?
