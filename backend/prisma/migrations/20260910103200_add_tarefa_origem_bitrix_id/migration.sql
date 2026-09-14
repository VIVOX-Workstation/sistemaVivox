ALTER TABLE "Tarefa" ADD COLUMN "origemBitrixId" TEXT;
CREATE UNIQUE INDEX "Tarefa_origemBitrixId_key" ON "Tarefa"("origemBitrixId");
