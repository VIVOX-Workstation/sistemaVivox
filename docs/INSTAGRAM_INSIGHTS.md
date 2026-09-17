# Leitura gerencial do Instagram

A tela apresenta três sugestões baseadas em regras e evidências, comparação de métricas e ranking de publicações. Não usa geração de texto por IA nem atribui causalidade ou vendas às métricas sociais.

## Contrato e critérios

- `GET /analytics/instagram/:clienteId?days=7|30|90&refresh=true`.
- Períodos iguais e contíguos, em dias completos UTC. `until` é exclusivo; o dia atual fica de fora.
- `overview` e `previousOverview` usam `total_value` da Meta. Alcance e contas engajadas diários não são somados, pois isso duplicaria pessoas.
- Visualizações usam `views`. A antiga consulta conjunta com `impressions` podia fazer todas as métricas falharem.
- Uma métrica ausente, recusada ou com erro é `null`. Zero só é mostrado quando retornado pela API. Períodos recusados pela Meta permanecem indisponíveis, sem extrapolação.
- Base anterior zero não gera porcentagem infinita. Seguidores e total de mídias são valores atuais e não têm comparação.
- O ranking inclui publicações criadas no intervalo. Seus contadores são acumulados até a consulta, não interações ocorridas exclusivamente no intervalo.
- Busca paginada limitada a 300 mídias. Insights adicionais consultados nas 30 mais recentes do intervalo, em lotes de cinco. Cobertura e valores ausentes são informados; rankings excluem métricas ausentes.
- Empates são ordenados pela publicação mais recente e pelo ID; a análise reconhece empates.
- Timeout por consulta: 8 segundos. Cache em memória por conta, hash do token, período e dia, por 5 minutos. Atualizar ignora o cache; requisições simultâneas iguais são agrupadas.
- As consultas leem o histórico disponível na Meta. Não há arquivo histórico permanente nem coleta agendada nesta etapa; dados antigos continuam sujeitos à disponibilidade da plataforma.

## Validação

```powershell
cd backend
npm test -- --runInBand instagram.service.spec.ts
npm run build
cd ../vivox-clientes
node --experimental-strip-types --test tests/instagramInsights.test.ts
npm run build
```

No navegador: testar 7/30/90 dias, Atualizar, troca de critério do ranking, dados parciais, ausência de publicações e o detalhe “Dados e critérios desta análise”.

Referência de campos: [SDK oficial da Meta — Instagram Insights Result](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/instagram-insights-result.js). A disponibilidade efetiva depende da conta, das permissões e da versão da API.
