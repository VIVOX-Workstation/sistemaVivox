-- VVOX Sync: dados da equipe ligados às contas do Sistema VIVOX (aditiva)
ALTER TABLE "User" ADD COLUMN "cargo" TEXT;
ALTER TABLE "User" ADD COLUMN "funcaoKanban" TEXT;
ALTER TABLE "User" ADD COLUMN "fotoUrl" TEXT;

CREATE TABLE "KanbanConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "permissoes" JSONB NOT NULL DEFAULT '{}',
    "cargos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diasClientes" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KanbanConfig_pkey" PRIMARY KEY ("id")
);
