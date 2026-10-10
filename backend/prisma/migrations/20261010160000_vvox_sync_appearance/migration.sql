-- Add presentation settings used by the original VVOX Sync interface.
-- Existing task state, timing, approvals and legacy column colors are preserved.
ALTER TABLE "KanbanQuadro" ADD COLUMN "descricao" TEXT, ADD COLUMN "icone" TEXT, ADD COLUMN "cor" TEXT;
ALTER TABLE "KanbanColuna" ADD COLUMN "corInterface" TEXT, ADD COLUMN "icone" TEXT,
  ADD COLUMN "marcador" TEXT NOT NULL DEFAULT 'dot', ADD COLUMN "preenchida" BOOLEAN NOT NULL DEFAULT false;
UPDATE "KanbanQuadro" SET "descricao" = 'Quadro de demandas do dia a dia, da entrada à entrega aprovada.', "icone" = 'zap', "cor" = 'gold' WHERE "fixo" = true;
UPDATE "KanbanColuna" SET "corInterface" = CASE "id"
  WHEN 'sync-backlog' THEN 'gray' WHEN 'sync-afazer' THEN 'gold' WHEN 'sync-doing' THEN 'blue'
  WHEN 'sync-review' THEN 'orange' WHEN 'sync-done' THEN 'green' ELSE NULL END,
  "icone" = CASE "id" WHEN 'sync-backlog' THEN 'inbox' WHEN 'sync-afazer' THEN 'list'
  WHEN 'sync-doing' THEN 'zap' WHEN 'sync-review' THEN 'eye' WHEN 'sync-done' THEN 'circleCheck' ELSE NULL END
WHERE "quadroId" = 'vivox-sync-diario';
