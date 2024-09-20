/*
  Warnings:

  - You are about to drop the column `projectId` on the `EmailSender` table. All the data in the column will be lost.
  - You are about to drop the column `emailDomainDomain` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `emailServiceConfigProjectId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailSender" DROP CONSTRAINT "EmailSender_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_emailDomainDomain_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_emailServiceConfigProjectId_fkey";

-- AlterTable
ALTER TABLE "EmailSender" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "emailDomainDomain",
DROP COLUMN "emailServiceConfigProjectId";

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
