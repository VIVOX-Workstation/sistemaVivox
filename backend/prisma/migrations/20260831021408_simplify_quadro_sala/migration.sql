/*
  Warnings:

  - You are about to drop the column `ciphertext` on the `QuadroSala` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `QuadroSala` table. All the data in the column will be lost.
  - You are about to drop the column `sceneVersion` on the `QuadroSala` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuadroSala" DROP COLUMN "ciphertext",
DROP COLUMN "iv",
DROP COLUMN "sceneVersion",
ADD COLUMN     "elements" JSONB NOT NULL DEFAULT '[]';
