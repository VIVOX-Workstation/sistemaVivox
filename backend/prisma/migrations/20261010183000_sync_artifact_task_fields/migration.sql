-- Additional task details and durable attachment metadata from the VVOX Sync Artifact.
ALTER TABLE "Tarefa" ADD COLUMN "clienteNome" TEXT,
  ADD COLUMN "fonte" TEXT,
  ADD COLUMN "subtitulo" TEXT,
  ADD COLUMN "linksReferencia" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "KanbanColuna" ADD COLUMN "planoPublicacao" TEXT;
ALTER TABLE "KanbanColuna" ADD CONSTRAINT "KanbanColuna_planoPublicacao_check" CHECK ("planoPublicacao" IS NULL OR "planoPublicacao" IN ('', 'todo', 'sched'));
ALTER TABLE "TarefaComentario" ADD COLUMN "anexoTipo" TEXT,
  ADD COLUMN "anexoTamanho" INTEGER,
  ADD COLUMN "audioDuracao" INTEGER;
