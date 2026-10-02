-- CreateEnum
CREATE TYPE "StatusInteresse" AS ENUM ('NOVO', 'CONTATADO', 'CONVERTIDO', 'DESCARTADO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CLIENTE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "senhaPortalCriptografada" TEXT;

-- CreateTable
CREATE TABLE "InteresseServico" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoServico" "TipoServico" NOT NULL,
    "status" "StatusInteresse" NOT NULL DEFAULT 'NOVO',
    "mensagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InteresseServico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InteresseServico_clienteId_tipoServico_key" ON "InteresseServico"("clienteId", "tipoServico");

-- CreateIndex
CREATE UNIQUE INDEX "User_clienteId_key" ON "User"("clienteId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteresseServico" ADD CONSTRAINT "InteresseServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
