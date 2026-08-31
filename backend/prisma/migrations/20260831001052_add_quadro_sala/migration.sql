-- CreateTable
CREATE TABLE "QuadroSala" (
    "roomId" TEXT NOT NULL,
    "sceneVersion" INTEGER NOT NULL DEFAULT 0,
    "iv" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroSala_pkey" PRIMARY KEY ("roomId")
);
