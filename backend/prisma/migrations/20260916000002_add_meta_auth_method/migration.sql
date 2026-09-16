-- CreateEnum
CREATE TYPE "MetaAuthMethod" AS ENUM ('FACEBOOK', 'INSTAGRAM');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "metaAuthMethod" "MetaAuthMethod";
