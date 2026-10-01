# Hospedagem de landing pages

No planejamento de uma landing page, informe a URL, a data de início e o prazo contratado. O vencimento é calculado pelo backend e aparece no planejamento, na aba Landing Pages do cliente, no Radar de Renovações e no dashboard.

Exemplo: início em 01/10/2026 e prazo de 12 meses resultam em vencimento em 01/10/2027. Quando o mês de destino não tem o mesmo dia, o cálculo usa seu último dia: 29/02/2024 + 12 meses resulta em 28/02/2025.

Hospedagem e domínio têm datas independentes. O radar destaca a data mais próxima, incluindo hospedagens vencidas. Uma hospedagem vinculada exige que o serviço e o item pertençam ao cliente. O índice único impede duas hospedagens para o mesmo item de um serviço.

Cadastros antigos sem início/prazo continuam aceitando vencimento manual. Não há migração automática de datas antigas para novos prazos.

## Ambiente local

O frontend usa `http://localhost:3000` quando aberto em `http://localhost:5173`. O Compose local inicia PostgreSQL com pgvector, Redis, MinIO, backend e sala colaborativa:

```powershell
docker compose up -d
```

O backend gera o Prisma Client e aplica migrations ao iniciar. Os arquivos compilados ficam em um volume separado para evitar conflitos com builds no Windows; `nest-cli.docker.json` mantém esse diretório montado.

O Compose local usa a imagem MinIO publicada pelo Coollabs, com versão fixa, e reutiliza o cliente `mc` incluído nela para inicializar o bucket. As configurações de produção não foram alteradas.

## Validação

```powershell
cd backend
npm test -- --runInBand hospedagem
cd ..
docker compose exec -T backend node test/hospedagem-smoke.cjs
```

O smoke test usa a API real e cria dados temporários no banco. Remove esses dados ao finalizar e verifica persistência do planejamento, cálculo, alteração de prazo, rejeição de duplicatas e datas inválidas, radar e dashboard.
