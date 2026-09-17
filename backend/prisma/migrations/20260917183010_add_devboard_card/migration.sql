-- CreateEnum
CREATE TYPE "DevCardTag" AS ENUM ('FEATURE', 'BUG', 'ENHANCEMENT', 'DOCS');

-- CreateEnum
CREATE TYPE "DevCardColuna" AS ENUM ('BACKLOG', 'EM_PROGRESSO', 'EM_REVISAO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "DevBoardCard" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tag" "DevCardTag" NOT NULL DEFAULT 'FEATURE',
    "coluna" "DevCardColuna" NOT NULL DEFAULT 'BACKLOG',
    "assignee" TEXT,
    "branch" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL DEFAULT 'main',
    "description" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevBoardCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevBoardCard_servicoId_idx" ON "DevBoardCard"("servicoId");

-- CreateIndex
CREATE UNIQUE INDEX "DevBoardCard_servicoId_prNumber_key" ON "DevBoardCard"("servicoId", "prNumber");

-- AddForeignKey
ALTER TABLE "DevBoardCard" ADD CONSTRAINT "DevBoardCard_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "ServicoContratado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
