-- AlterTable: novos usuários já nascem com o módulo Acompanhamento
ALTER TABLE "User" ALTER COLUMN "modulos" SET DEFAULT ARRAY['DASHBOARD', 'CLIENTES', 'HOSPEDAGENS', 'ANALYTICS', 'GP', 'EDUCACIONAL', 'ACOMPANHAMENTO']::"ModuloSistema"[];

-- Usuários existentes também ganham o módulo (o admin pode retirar em Configurações)
UPDATE "User"
SET "modulos" = array_append("modulos", 'ACOMPANHAMENTO'::"ModuloSistema")
WHERE NOT ('ACOMPANHAMENTO'::"ModuloSistema" = ANY("modulos"));

-- AlterTable: campos da planilha de acompanhamento
ALTER TABLE "Publicacao" ADD COLUMN     "assunto" TEXT,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "salvamentos" INTEGER,
ADD COLUMN     "visualizacoes" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Publicacao_clienteId_dataPublicacao_idx" ON "Publicacao"("clienteId", "dataPublicacao");
