ALTER TABLE "AtivoHospedagem"
  ADD COLUMN "servicoContratadoId" TEXT,
  ADD COLUMN "itemPlanejadoId" TEXT,
  ADD COLUMN "dataInicioHospedagem" DATE,
  ADD COLUMN "prazoHospedagemMeses" INTEGER;

CREATE UNIQUE INDEX "AtivoHospedagem_servicoContratadoId_itemPlanejadoId_key"
  ON "AtivoHospedagem"("servicoContratadoId", "itemPlanejadoId");

ALTER TABLE "AtivoHospedagem" ADD CONSTRAINT "AtivoHospedagem_servicoContratadoId_fkey"
  FOREIGN KEY ("servicoContratadoId") REFERENCES "ServicoContratado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
