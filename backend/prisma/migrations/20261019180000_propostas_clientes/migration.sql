-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "validade" DATE,
    "corDestaque" TEXT NOT NULL DEFAULT '#91672b',
    "secoes" JSONB NOT NULL,
    "linkHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposta_linkHash_key" ON "Proposta"("linkHash");

-- CreateIndex
CREATE INDEX "Proposta_clienteId_createdAt_idx" ON "Proposta"("clienteId", "createdAt");

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

