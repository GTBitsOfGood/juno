/*
  Warnings:

  - You are about to drop the `Email` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_projectId_fkey";

-- AlterTable
ALTER TABLE "EmailDomain" ADD COLUMN     "emailServiceConfigProjectId" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "emailServiceConfigProjectId" INTEGER;

-- DropTable
DROP TABLE "Email";

-- CreateTable
CREATE TABLE "EmailServiceConfig" (
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "EmailServiceConfig_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "EmailSender" (
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "projectId" INTEGER NOT NULL,
    "emailServiceConfigProjectId" INTEGER,

    CONSTRAINT "EmailSender_pkey" PRIMARY KEY ("name","domain")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_emailServiceConfigProjectId_fkey" FOREIGN KEY ("emailServiceConfigProjectId") REFERENCES "EmailServiceConfig"("projectId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSender" ADD CONSTRAINT "EmailSender_domain_fkey" FOREIGN KEY ("domain") REFERENCES "EmailDomain"("domain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSender" ADD CONSTRAINT "EmailSender_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSender" ADD CONSTRAINT "EmailSender_emailServiceConfigProjectId_fkey" FOREIGN KEY ("emailServiceConfigProjectId") REFERENCES "EmailServiceConfig"("projectId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDomain" ADD CONSTRAINT "EmailDomain_emailServiceConfigProjectId_fkey" FOREIGN KEY ("emailServiceConfigProjectId") REFERENCES "EmailServiceConfig"("projectId") ON DELETE SET NULL ON UPDATE CASCADE;
