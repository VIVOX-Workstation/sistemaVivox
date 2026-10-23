-- AlterTable
ALTER TABLE "Proposta" ADD COLUMN "formato" TEXT NOT NULL DEFAULT 'documento',
ADD COLUMN "arquivoKey" TEXT,
ADD COLUMN "nomeArquivo" TEXT,
ADD COLUMN "tamanho" INTEGER,
ADD COLUMN "criadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
