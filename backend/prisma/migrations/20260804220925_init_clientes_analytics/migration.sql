-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'PAUSADO', 'ENCERRADO', 'PROSPECT');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('GERENCIAMENTO_REDES', 'FOLDER', 'REVISTA', 'LANDING_PAGE', 'APP', 'FOTOGRAFIA', 'VIDEO', 'TRAFEGO_PAGO', 'IDENTIDADE_VISUAL');

-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('ATIVO', 'CONCLUIDO', 'PAUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoProducao" AS ENUM ('POST', 'VIDEO', 'FOLDER', 'REVISTA', 'LANDING_PAGE', 'APP', 'FOTO');

-- CreateEnum
CREATE TYPE "StatusProducao" AS ENUM ('EM_PRODUCAO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "OrigemDado" AS ENUM ('REPORTEI', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoPublicacao" AS ENUM ('POST', 'REELS', 'CARROSSEL', 'STORY', 'VIDEO');

-- CreateEnum
CREATE TYPE "StatusOportunidade" AS ENUM ('ABERTA', 'APRESENTADA', 'ACEITA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "StatusReuniao" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpjCpf" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "responsavelId" TEXT,
    "contatos" JSONB NOT NULL,
    "status" "StatusCliente" NOT NULL,
    "dataInicioContrato" TIMESTAMP(3),
    "dataFimContrato" TIMESTAMP(3),
    "logoUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoContratado" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoServico" "TipoServico" NOT NULL,
    "status" "StatusServico" NOT NULL,
    "dataContratacao" TIMESTAMP(3) NOT NULL,
    "dataEntrega" TIMESTAMP(3),
    "valor" DECIMAL(65,30),
    "descricaoEscopo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoContratado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoHistorico" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "servicoId" TEXT,
    "tipo" "TipoProducao" NOT NULL,
    "arquivoUrl" TEXT,
    "dataProducao" TIMESTAMP(3),
    "responsavelId" TEXT,
    "status" "StatusProducao" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidiaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[],
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MidiaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "origem" "OrigemDado" NOT NULL,
    "alcanceTotal" INTEGER,
    "engajamentoTotal" INTEGER,
    "notaGmb" DOUBLE PRECISION,
    "avaliacoesGmbPeriodo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicacao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "producaoId" TEXT,
    "tipo" "TipoPublicacao" NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL,
    "alcance" INTEGER,
    "curtidas" INTEGER,
    "comentarios" INTEGER,
    "compartilhamentos" INTEGER,
    "origemDado" "OrigemDado" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoGmb" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "respondida" BOOLEAN NOT NULL DEFAULT false,
    "dataResposta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoGmb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oportunidade" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "servicoSugerido" "TipoServico" NOT NULL,
    "justificativa" TEXT,
    "status" "StatusOportunidade" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oportunidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "resumo" TEXT,
    "status" "StatusReuniao" NOT NULL DEFAULT 'AGENDADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ReuniaoParticipantes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ReuniaoParticipantes_AB_unique" ON "_ReuniaoParticipantes"("A", "B");

-- CreateIndex
CREATE INDEX "_ReuniaoParticipantes_B_index" ON "_ReuniaoParticipantes"("B");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoContratado" ADD CONSTRAINT "ServicoContratado_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoHistorico" ADD CONSTRAINT "ServicoHistorico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "ServicoContratado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoHistorico" ADD CONSTRAINT "ServicoHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producao" ADD CONSTRAINT "Producao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producao" ADD CONSTRAINT "Producao_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "ServicoContratado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producao" ADD CONSTRAINT "Producao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaCliente" ADD CONSTRAINT "MidiaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_producaoId_fkey" FOREIGN KEY ("producaoId") REFERENCES "Producao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoGmb" ADD CONSTRAINT "AvaliacaoGmb_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidade" ADD CONSTRAINT "Oportunidade_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReuniaoParticipantes" ADD CONSTRAINT "_ReuniaoParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES "Reuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReuniaoParticipantes" ADD CONSTRAINT "_ReuniaoParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
