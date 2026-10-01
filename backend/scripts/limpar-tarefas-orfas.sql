-- Limpeza das tarefas órfãs (sem workspace) deixadas por workspaces excluídos.
-- Executar manualmente no banco de PRODUÇÃO, passo a passo. NÃO rodar tudo de uma vez.
--
-- Critério conservador de "órfã": sem workspace (projetoId nulo), sem serviço contratado
-- e sem chamado vinculado. Tarefas ligadas a cliente/serviço/chamado ficam preservadas.
-- Checklist e comentários são removidos em cascata (ON DELETE CASCADE).

-- ============ PASSO 1: conferir os números (somente leitura) ============
SELECT
  count(*)                                                        AS total_sem_workspace,
  count(*) FILTER (WHERE t."servicoId" IS NOT NULL)               AS com_servico,
  count(*) FILTER (WHERE c."id" IS NOT NULL)                      AS com_chamado,
  count(*) FILTER (WHERE t."servicoId" IS NULL AND c."id" IS NULL) AS candidatas_a_exclusao,
  count(*) FILTER (WHERE t."origemBitrixId" IS NOT NULL
                   AND t."servicoId" IS NULL AND c."id" IS NULL)  AS candidatas_importadas_bitrix
FROM "Tarefa" t
LEFT JOIN "Chamado" c ON c."tarefaId" = t."id"
WHERE t."projetoId" IS NULL;
-- Esperado: candidatas_a_exclusao próximo de 5660 (8491 no total - 2831 do GERAL 2026).
-- Se o número for muito diferente, PARE e investigue antes de continuar.

-- Amostra para olhar a olho (títulos, datas, status):
SELECT t."id", t."titulo", t."status", t."createdAt", t."origemBitrixId"
FROM "Tarefa" t
LEFT JOIN "Chamado" c ON c."tarefaId" = t."id"
WHERE t."projetoId" IS NULL AND t."servicoId" IS NULL AND c."id" IS NULL
ORDER BY t."createdAt" DESC
LIMIT 30;

-- ============ PASSO 2: backup (antes de qualquer exclusão) ============
-- Preferível: pg_dump do banco inteiro feito pelo Coolify/VPS. Backup rápido em tabela:
CREATE TABLE IF NOT EXISTS "_backup_tarefas_orfas_20261001" AS
SELECT t.*
FROM "Tarefa" t
LEFT JOIN "Chamado" c ON c."tarefaId" = t."id"
WHERE t."projetoId" IS NULL AND t."servicoId" IS NULL AND c."id" IS NULL;

SELECT count(*) AS linhas_no_backup FROM "_backup_tarefas_orfas_20261001";

-- ============ PASSO 3: excluir (só depois de conferir os passos 1 e 2) ============
-- Rode dentro de uma transação e confira o número antes do COMMIT.
BEGIN;

DELETE FROM "Tarefa" t
WHERE t."projetoId" IS NULL
  AND t."servicoId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Chamado" c WHERE c."tarefaId" = t."id");
-- O psql mostra "DELETE <n>". Se <n> bater com candidatas_a_exclusao: COMMIT;
-- Se algo parecer errado: ROLLBACK;

-- COMMIT;
-- ROLLBACK;

-- ============ PASSO 4: verificar ============
-- SELECT count(*) FROM "Tarefa";   -- deve bater com a soma das tarefas dos workspaces + as preservadas
-- Depois de alguns dias sem problemas: DROP TABLE "_backup_tarefas_orfas_20261001";
