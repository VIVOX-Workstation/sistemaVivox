-- VVOX Sync: preserve Tarefa IDs, links, legacy time and business statuses.
CREATE TABLE "KanbanQuadro" (
  "id" TEXT PRIMARY KEY, "nome" TEXT NOT NULL, "fixo" BOOLEAN NOT NULL DEFAULT false,
  "revisaoObrigatoria" BOOLEAN NOT NULL DEFAULT true, "proximoNumero" INTEGER NOT NULL DEFAULT 1,
  "criadorId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "KanbanColuna" (
  "id" TEXT PRIMARY KEY, "quadroId" TEXT NOT NULL REFERENCES "KanbanQuadro"("id") ON DELETE CASCADE,
  "nome" TEXT NOT NULL, "papel" TEXT NOT NULL DEFAULT 'none', "cor" TEXT NOT NULL DEFAULT '#C7A15F',
  "ordem" INTEGER NOT NULL DEFAULT 0, "statusLegado" TEXT,
  CONSTRAINT "KanbanColuna_papel_check" CHECK ("papel" IN ('queue','doing','review','done','none'))
);
CREATE INDEX "KanbanColuna_quadroId_ordem_idx" ON "KanbanColuna"("quadroId","ordem");
CREATE UNIQUE INDEX "KanbanColuna_papel_unico" ON "KanbanColuna"("quadroId","papel") WHERE "papel" IN ('doing','review','done');
CREATE UNIQUE INDEX "KanbanQuadro_fixo_unico" ON "KanbanQuadro"("fixo") WHERE "fixo" = true;
ALTER TABLE "Tarefa" ADD COLUMN "quadroId" TEXT REFERENCES "KanbanQuadro"("id") ON DELETE RESTRICT,
  ADD COLUMN "colunaId" TEXT REFERENCES "KanbanColuna"("id") ON DELETE RESTRICT,
  ADD COLUMN "numero" INTEGER, ADD COLUMN "versao" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "entregueEm" TIMESTAMP(3), ADD COLUMN "aprovadoEm" TIMESTAMP(3), ADD COLUMN "aprovadoPorId" TEXT,
  ADD COLUMN "revisorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "Tarefa_quadroId_numero_key" ON "Tarefa"("quadroId","numero");
CREATE INDEX "Tarefa_quadroId_colunaId_ordem_idx" ON "Tarefa"("quadroId","colunaId","ordem");
CREATE TABLE "TarefaSessao" (
  "id" TEXT PRIMARY KEY, "tarefaId" TEXT NOT NULL REFERENCES "Tarefa"("id") ON DELETE CASCADE,
  "usuarioId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT, "autorId" TEXT NOT NULL,
  "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "fim" TIMESTAMP(3), "segundos" DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX "TarefaSessao_tarefaId_inicio_idx" ON "TarefaSessao"("tarefaId","inicio");
CREATE INDEX "TarefaSessao_usuarioId_fim_idx" ON "TarefaSessao"("usuarioId","fim");
-- Defense in depth: concurrent requests cannot leave two timers active.
CREATE UNIQUE INDEX "TarefaSessao_usuario_ativa_key" ON "TarefaSessao"("usuarioId") WHERE "fim" IS NULL;
CREATE UNIQUE INDEX "TarefaSessao_tarefa_ativa_key" ON "TarefaSessao"("tarefaId") WHERE "fim" IS NULL;
INSERT INTO "KanbanQuadro" ("id","nome","fixo") VALUES ('vivox-sync-diario','Operação diária',true);
INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel","cor","ordem","statusLegado") VALUES
 ('sync-backlog','vivox-sync-diario','Recebimento de demanda','queue','#94a3b8',0,'BACKLOG'),
 ('sync-afazer','vivox-sync-diario','Estruturação e a fazer','queue','#c7a15f',1,'A_FAZER'),
 ('sync-doing','vivox-sync-diario','Em execução','doing','#3b82f6',2,'EM_ANDAMENTO'),
 ('sync-review','vivox-sync-diario','Aprovação interna','review','#a855f7',3,'EM_REVISAO'),
 ('sync-done','vivox-sync-diario','Concluídas','done','#22c55e',4,'CONCLUIDA');
-- Custom statuses were previously browser column IDs. Retain every occupied stage.
INSERT INTO "KanbanColuna" ("id","quadroId","nome","papel","ordem","statusLegado")
 SELECT 'sync-legado-' || md5("status"), 'vivox-sync-diario',
 CASE WHEN "status"='CANCELADA' THEN 'Canceladas' ELSE 'Etapa existente: ' || "status" END,
 'none', 4 + row_number() OVER (ORDER BY "status"), "status"
 FROM (SELECT DISTINCT "status" FROM "Tarefa" WHERE "status" NOT IN ('BACKLOG','A_FAZER','EM_ANDAMENTO','EM_REVISAO','CONCLUIDA')) stages;
WITH numbered AS (SELECT "id", row_number() OVER (ORDER BY "createdAt","id") AS n FROM "Tarefa")
 UPDATE "Tarefa" t SET "quadroId"='vivox-sync-diario', "numero"=n.n,
 "colunaId"=c."id", "entregueEm"=CASE WHEN t."status"='EM_REVISAO' THEN t."updatedAt" ELSE NULL END,
 "aprovadoEm"=CASE WHEN t."status"='CONCLUIDA' THEN t."dataConclusao" ELSE NULL END
 FROM numbered n, "KanbanColuna" c WHERE t."id"=n."id" AND c."statusLegado"=t."status";
UPDATE "KanbanQuadro" SET "proximoNumero"=(SELECT COALESCE(MAX("numero"),0)+1 FROM "Tarefa") WHERE "id"='vivox-sync-diario';

-- Integrations/imports still create Tarefa directly. Assign their board, column and
-- number atomically too; deleted numbers are never reused.
CREATE FUNCTION "sync_adopt_tarefa"() RETURNS trigger LANGUAGE plpgsql AS $$
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
CREATE TRIGGER "Tarefa_sync_adopt" BEFORE INSERT ON "Tarefa" FOR EACH ROW EXECUTE FUNCTION "sync_adopt_tarefa"();

