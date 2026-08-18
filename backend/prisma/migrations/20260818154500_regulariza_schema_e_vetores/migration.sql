-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "StatusHospedagem" AS ENUM ('ATIVO', 'PENDENTE_RENOVACAO', 'MANUTENCAO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CicloRenovacao" AS ENUM ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL');

-- CreateEnum
CREATE TYPE "StatusPlanejamento" AS ENUM ('BRIEFING', 'PLANEJAMENTO', 'EM_PRODUCAO', 'EM_REVISAO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusEscopoItem" AS ENUM ('PLANEJADO', 'EM_DESENVOLVIMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusMarco" AS ENUM ('PENDENTE', 'CONCLUIDO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "TipoReferencia" AS ENUM ('LINK', 'ARQUIVO', 'IMAGEM');

-- CreateEnum
CREATE TYPE "TipoEventoHistorico" AS ENUM ('CRIACAO', 'ESCOPO_ALTERADO', 'PRAZO_ALTERADO', 'STATUS_ALTERADO', 'MARCO_CONCLUIDO', 'RESPONSAVEL_ALTERADO', 'RENOVACAO', 'PAUSA', 'CANCELAMENTO', 'NOTA_MANUAL');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "ga4PropertyId" TEXT,
ADD COLUMN     "gscSiteUrl" TEXT;

-- CreateTable
CREATE TABLE "FonteContexto" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FonteContexto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoVetorial" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "titulo" TEXT,
    "vetor" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoVetorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteligenciaMercado" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "tendencias" JSONB NOT NULL,
    "fontes" JSONB NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteligenciaMercado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanejamentoServico" (
    "id" TEXT NOT NULL,
    "servicoContratadoId" TEXT NOT NULL,
    "ideiaBriefing" TEXT,
    "statusGeral" "StatusPlanejamento" NOT NULL DEFAULT 'BRIEFING',
    "prazoEntrega" TIMESTAMP(3),
    "flowNodes" JSONB,
    "flowEdges" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanejamentoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscopoItem" (
    "id" TEXT NOT NULL,
    "planejamentoServicoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusEscopoItem" NOT NULL DEFAULT 'PLANEJADO',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscopoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marco" (
    "id" TEXT NOT NULL,
    "planejamentoServicoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "dataRealizada" TIMESTAMP(3),
    "status" "StatusMarco" NOT NULL DEFAULT 'PENDENTE',
    "dependeDeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenciaServico" (
    "id" TEXT NOT NULL,
    "planejamentoServicoId" TEXT NOT NULL,
    "tipo" "TipoReferencia" NOT NULL,
    "urlOuArquivo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenciaServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoServico" (
    "id" TEXT NOT NULL,
    "planejamentoServicoId" TEXT NOT NULL,
    "tipoEvento" "TipoEventoHistorico" NOT NULL,
    "descricao" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,

    CONSTRAINT "HistoricoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtivoHospedagem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provedorVps" TEXT,
    "ipServidor" TEXT,
    "dataRenovacaoVps" TIMESTAMP(3),
    "cicloVps" "CicloRenovacao" NOT NULL DEFAULT 'ANUAL',
    "custoVps" DECIMAL(65,30),
    "valorCobrado" DECIMAL(65,30),
    "dominio" TEXT,
    "registradorDominio" TEXT,
    "dataExpiracaoDominio" TIMESTAMP(3),
    "dnsProvedor" TEXT,
    "status" "StatusHospedagem" NOT NULL DEFAULT 'ATIVO',
    "sslAtivo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtivoHospedagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlanejamentoResponsaveis" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "DocumentoVetorial_clienteId_idx" ON "DocumentoVetorial"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanejamentoServico_servicoContratadoId_key" ON "PlanejamentoServico"("servicoContratadoId");

-- CreateIndex
CREATE INDEX "AtivoHospedagem_clienteId_idx" ON "AtivoHospedagem"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "_PlanejamentoResponsaveis_AB_unique" ON "_PlanejamentoResponsaveis"("A", "B");

-- CreateIndex
CREATE INDEX "_PlanejamentoResponsaveis_B_index" ON "_PlanejamentoResponsaveis"("B");

-- AddForeignKey
ALTER TABLE "FonteContexto" ADD CONSTRAINT "FonteContexto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoVetorial" ADD CONSTRAINT "DocumentoVetorial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteligenciaMercado" ADD CONSTRAINT "InteligenciaMercado_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanejamentoServico" ADD CONSTRAINT "PlanejamentoServico_servicoContratadoId_fkey" FOREIGN KEY ("servicoContratadoId") REFERENCES "ServicoContratado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscopoItem" ADD CONSTRAINT "EscopoItem_planejamentoServicoId_fkey" FOREIGN KEY ("planejamentoServicoId") REFERENCES "PlanejamentoServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marco" ADD CONSTRAINT "Marco_planejamentoServicoId_fkey" FOREIGN KEY ("planejamentoServicoId") REFERENCES "PlanejamentoServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marco" ADD CONSTRAINT "Marco_dependeDeId_fkey" FOREIGN KEY ("dependeDeId") REFERENCES "Marco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenciaServico" ADD CONSTRAINT "ReferenciaServico_planejamentoServicoId_fkey" FOREIGN KEY ("planejamentoServicoId") REFERENCES "PlanejamentoServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoServico" ADD CONSTRAINT "HistoricoServico_planejamentoServicoId_fkey" FOREIGN KEY ("planejamentoServicoId") REFERENCES "PlanejamentoServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoServico" ADD CONSTRAINT "HistoricoServico_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtivoHospedagem" ADD CONSTRAINT "AtivoHospedagem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanejamentoResponsaveis" ADD CONSTRAINT "_PlanejamentoResponsaveis_A_fkey" FOREIGN KEY ("A") REFERENCES "PlanejamentoServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanejamentoResponsaveis" ADD CONSTRAINT "_PlanejamentoResponsaveis_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentoVetorial_vetor_hnsw_idx" ON "DocumentoVetorial" USING hnsw (vetor vector_cosine_ops);
