CREATE TABLE "InstagramFollowerSnapshot" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstagramFollowerSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstagramFollowerSnapshot_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InstagramFollowerSnapshot_clienteId_instagramAccountId_captur_key" ON "InstagramFollowerSnapshot"("clienteId", "instagramAccountId", "capturedAt");
CREATE INDEX "InstagramFollowerSnapshot_clienteId_instagramAccountId_captur_idx" ON "InstagramFollowerSnapshot"("clienteId", "instagramAccountId", "capturedAt");
