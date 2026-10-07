-- CreateEnum
CREATE TYPE "ModuloSistema" AS ENUM ('DASHBOARD', 'CLIENTES', 'HOSPEDAGENS', 'ANALYTICS', 'GP', 'EDUCACIONAL');

-- AlterTable: usuários existentes recebem todos os módulos (nada muda para quem já usa o sistema)
ALTER TABLE "User" ADD COLUMN     "modulos" "ModuloSistema"[] DEFAULT ARRAY['DASHBOARD', 'CLIENTES', 'HOSPEDAGENS', 'ANALYTICS', 'GP', 'EDUCACIONAL']::"ModuloSistema"[];
