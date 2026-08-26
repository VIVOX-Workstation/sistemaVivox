-- CreateEnum
CREATE TYPE "CategoriaChamado" AS ENUM ('BUG', 'AJUSTE', 'DUVIDA', 'ACESSO', 'OUTRO');

-- CreateEnum
CREATE TYPE "UrgenciaChamado" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- AlterTable
ALTER TABLE "Chamado" ADD COLUMN     "anexos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "categoria" "CategoriaChamado" DEFAULT 'OUTRO',
ADD COLUMN     "titulo" TEXT,
ADD COLUMN     "urgencia" "UrgenciaChamado" DEFAULT 'MEDIA';
