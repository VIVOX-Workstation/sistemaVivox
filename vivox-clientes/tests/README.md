# Verificação de desempenho do Kanban

Com o Vite iniciado, abra `/tests/kanban-performance.html`. A fixture usa o
componente real com 2.829 tarefas fictícias e não consulta nem modifica o banco.
Ela não é uma rota do aplicativo nem uma entrada do build de produção.

Verificações realizadas em 11/09/2026:

- Apenas 12 cartões montados inicialmente, com os totais de 479, 2 e 2.348
  preservados nas colunas. O número montado varia com o tamanho da janela.
- Rolagem até a tarefa 2.829 e abertura pelo cartão.
- Busca por `2829` após rolar até o final, busca sem resultados e limpeza da busca.
- Arrastar a tarefa 2.829 de Concluídas para Aprovação Interna, atualizando
  contagem e progresso, sem persistência externa.
- Ausência de erros no console durante esses fluxos.

O Profiler mediu 1.353 ms no primeiro commit antes da virtualização e 24,6 ms
depois, no mesmo navegador em desenvolvimento. Esse indicador é o tempo de
renderização React do primeiro commit, não a latência total da página; as
medições de altura da lista virtual podem gerar commits adicionais.

A consulta do workspace real no container levou 327 ms e produziu 3.385.454
bytes. Um teste HTTP local no container com o middleware de compressão e o mesmo
JSON retornou 349.924 bytes em gzip (90% menos), com igualdade exata após
descompressão. Essas medições não incluem autenticação ou rede do navegador.

O Redis respondeu PONG, mas não foi necessário adicionar cache: a correção
principal reduz o trabalho de renderização e o volume transferido, preservando
a consulta atualizada ao banco.

Implementação baseada nas APIs de [virtualização e medição dinâmica do TanStack](https://tanstack.com/virtual/latest/docs/api/virtualizer)
e no [middleware de compressão do Express](https://expressjs.com/en/resources/middleware/compression/).

## Planejamento de entregas

Com o Vite iniciado, abra `/tests/planejamento-entrega.html`. A página usa o
componente real com um adaptador de API em memória: não consulta nem altera o
banco. O recarregamento reinicia apenas os dados da fixture `fixture-entrega`.

Verificado no navegador em 12/09/2026:
- Briefing, Conteúdo e Produção com links acessíveis em todas as áreas.
- Edição do texto e CTA por seção; texto geral anterior preservado.
- Vinculação de uma tarefa existente e criação com título/descrição preenchidos.
- Desvinculação devolve a tarefa à lista de disponíveis sem excluí-la.
- Checklist anterior preserva itens concluídos; criar tarefa com pendências
  preenche somente os itens não concluídos no checklist da nova tarefa.

A fixture não valida autenticação nem persistência no backend real.
