-- AlterTable
ALTER TABLE "ServicoContratado" ADD COLUMN     "githubConnectedAt" TIMESTAMP(3),
ADD COLUMN     "githubInstallationId" TEXT,
ADD COLUMN     "githubRepoName" TEXT,
ADD COLUMN     "githubRepoOwner" TEXT;
