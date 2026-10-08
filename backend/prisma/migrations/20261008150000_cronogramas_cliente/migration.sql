-- CreateTable
CREATE TABLE "CronogramaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ano" INTEGER,
    "mes" INTEGER,
    "arquivoKey" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "enviadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronogramaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronogramaCliente_clienteId_createdAt_idx" ON "CronogramaCliente"("clienteId", "createdAt");

-- AddForeignKey
ALTER TABLE "CronogramaCliente" ADD CONSTRAINT "CronogramaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronogramaCliente" ADD CONSTRAINT "CronogramaCliente_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

