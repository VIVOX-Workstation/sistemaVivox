-- migrate diff creates Prisma's schema, but omits migration data, triggers,
-- checks and partial indexes. Restore the Sync invariants for installations
-- bootstrapped this way. This is also safe on databases that ran the old SQL.
BEGIN;
LOCK TABLE "Tarefa", "KanbanQuadro", "KanbanColuna" IN SHARE ROW EXCLUSIVE MODE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"KanbanColuna"'::regclass AND conname = 'KanbanColuna_papel_check') THEN
    ALTER TABLE "KanbanColuna" ADD CONSTRAINT "KanbanColuna_papel_check"
      CHECK ("papel" IN ('queue','doing','review','done','none'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "KanbanColuna_papel_unico" ON "KanbanColuna"("quadroId","papel") WHERE "papel" IN ('doing','review','done');
CREATE UNIQUE INDEX IF NOT EXISTS "KanbanQuadro_fixo_unico" ON "KanbanQuadro"("fixo") WHERE "fixo" = true;
CREATE UNIQUE INDEX IF NOT EXISTS "TarefaSessao_usuario_ativa_key" ON "TarefaSessao"("usuarioId") WHERE "fim" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "TarefaSessao_tarefa_ativa_key" ON "TarefaSessao"("tarefaId") WHERE "fim" IS NULL;

INSERT INTO "KanbanQuadro" ("id","nome","fixo","descricao","icone","cor","updatedAt")
VALUES ('vivox-sync-diario','Operação diária',true,'Quadro de demandas do dia a dia, da entrada à entrega aprovada.','zap','gold',CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel","cor","ordem","statusLegado","corInterface","icone") VALUES
 ('sync-backlog','vivox-sync-diario','Recebimento de demanda','queue','#94a3b8',0,'BACKLOG','gray','inbox'),
 ('sync-afazer','vivox-sync-diario','Estruturação e a fazer','queue','#c7a15f',1,'A_FAZER','gold','list'),
 ('sync-doing','vivox-sync-diario','Em execução','doing','#3b82f6',2,'EM_ANDAMENTO','blue','zap'),
 ('sync-review','vivox-sync-diario','Aprovação interna','review','#a855f7',3,'EM_REVISAO','orange','eye'),
 ('sync-done','vivox-sync-diario','Concluídas','done','#22c55e',4,'CONCLUIDA','green','circleCheck')
ON CONFLICT ("id") DO NOTHING;

-- Adopt only legacy tasks with no board; preserve all existing board assignments,
-- task IDs, business statuses, numbers, timings and approval information.
INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel","ordem","statusLegado")
SELECT 'sync-legado-' || md5(stages."status"), 'vivox-sync-diario',
  CASE WHEN stages."status"='CANCELADA' THEN 'Canceladas' ELSE 'Etapa existente: ' || stages."status" END,
  'none', 4 + row_number() OVER (ORDER BY stages."status"), stages."status"
FROM (SELECT DISTINCT "status" FROM "Tarefa" WHERE "quadroId" IS NULL) stages
WHERE NOT EXISTS (SELECT 1 FROM "KanbanColuna" c WHERE c."quadroId"='vivox-sync-diario' AND c."statusLegado"=stages."status")
ON CONFLICT ("id") DO NOTHING;

UPDATE "Tarefa" t SET "quadroId"='vivox-sync-diario', "colunaId"=c."id",
  "entregueEm"=COALESCE(t."entregueEm", CASE WHEN t."status"='EM_REVISAO' THEN t."updatedAt" END),
  "aprovadoEm"=COALESCE(t."aprovadoEm", CASE WHEN t."status"='CONCLUIDA' THEN t."dataConclusao" END)
FROM "KanbanColuna" c WHERE t."quadroId" IS NULL AND c."quadroId"='vivox-sync-diario' AND c."statusLegado"=t."status";
WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt","id") +
    (SELECT COALESCE(MAX("numero"),0) FROM "Tarefa" WHERE "quadroId"='vivox-sync-diario') AS n
  FROM "Tarefa" WHERE "quadroId"='vivox-sync-diario' AND "numero" IS NULL
)
UPDATE "Tarefa" t SET "numero"=n.n FROM numbered n WHERE t."id"=n."id";
UPDATE "KanbanQuadro" SET "proximoNumero"=GREATEST("proximoNumero",
  (SELECT COALESCE(MAX("numero"),0)+1 FROM "Tarefa" WHERE "quadroId"='vivox-sync-diario'))
WHERE "id"='vivox-sync-diario';

-- Keep imports and integrations that insert Tarefa directly on the same board.
CREATE OR REPLACE FUNCTION "sync_adopt_tarefa"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE board_id TEXT; column_id TEXT; column_board TEXT; column_status TEXT; allocated INTEGER;
BEGIN
  board_id := COALESCE(NEW."quadroId",'vivox-sync-diario');
  UPDATE "KanbanQuadro" SET "proximoNumero"="proximoNumero"+1 WHERE "id"=board_id RETURNING "proximoNumero"-1 INTO allocated;
  IF allocated IS NULL THEN RAISE EXCEPTION 'Quadro inexistente'; END IF;
  NEW."quadroId" := board_id;
  NEW."numero" := allocated;
  IF NEW."colunaId" IS NOT NULL THEN
    SELECT "quadroId","statusLegado" INTO column_board,column_status FROM "KanbanColuna" WHERE "id"=NEW."colunaId";
    IF column_board IS DISTINCT FROM board_id THEN RAISE EXCEPTION 'Coluna fora do quadro'; END IF;
  ELSE
    SELECT "id" INTO column_id FROM "KanbanColuna" WHERE "quadroId"=board_id AND "statusLegado"=NEW."status" ORDER BY "ordem" LIMIT 1;
    IF column_id IS NULL THEN
      IF NEW."status" NOT IN ('BACKLOG','A_FAZER','EM_ANDAMENTO','EM_REVISAO','CONCLUIDA') THEN
        column_id := 'sync-legado-' || md5(board_id || ':' || NEW."status");
        INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel","ordem","statusLegado")
        VALUES(column_id,board_id,'Etapa existente: ' || NEW."status",'none',100,NEW."status") ON CONFLICT ("id") DO NOTHING;
      ELSE
        SELECT "id" INTO column_id FROM "KanbanColuna" WHERE "quadroId"=board_id ORDER BY "ordem" LIMIT 1;
      END IF;
    END IF;
    NEW."colunaId" := column_id;
  END IF;
  RETURN NEW;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='"Tarefa"'::regclass AND tgname='Tarefa_sync_adopt') THEN
    CREATE TRIGGER "Tarefa_sync_adopt" BEFORE INSERT ON "Tarefa" FOR EACH ROW EXECUTE FUNCTION "sync_adopt_tarefa"();
  END IF;
END $$;
COMMIT;
