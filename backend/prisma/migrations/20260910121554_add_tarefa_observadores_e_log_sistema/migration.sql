-- AlterTable
ALTER TABLE "TarefaComentario" ADD COLUMN     "sistema" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_TarefaObservadores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TarefaObservadores_AB_unique" ON "_TarefaObservadores"("A", "B");

-- CreateIndex
CREATE INDEX "_TarefaObservadores_B_index" ON "_TarefaObservadores"("B");

-- AddForeignKey
ALTER TABLE "_TarefaObservadores" ADD CONSTRAINT "_TarefaObservadores_A_fkey" FOREIGN KEY ("A") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TarefaObservadores" ADD CONSTRAINT "_TarefaObservadores_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
