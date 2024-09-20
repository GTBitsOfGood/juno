/*
  Warnings:

  - You are about to drop the column `emailServiceConfigProjectId` on the `EmailDomain` table. All the data in the column will be lost.
  - You are about to drop the column `emailServiceConfigProjectId` on the `EmailSender` table. All the data in the column will be lost.
  - The primary key for the `EmailServiceConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `projectId` on the `EmailServiceConfig` table. All the data in the column will be lost.
  - Added the required column `id` to the `EmailServiceConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmailDomain" DROP CONSTRAINT "EmailDomain_emailServiceConfigProjectId_fkey";

-- DropForeignKey
ALTER TABLE "EmailSender" DROP CONSTRAINT "EmailSender_emailServiceConfigProjectId_fkey";

-- DropForeignKey
ALTER TABLE "EmailServiceConfig" DROP CONSTRAINT "EmailServiceConfig_projectId_fkey";

-- AlterTable
ALTER TABLE "EmailDomain" DROP COLUMN "emailServiceConfigProjectId";

-- AlterTable
ALTER TABLE "EmailSender" DROP COLUMN "emailServiceConfigProjectId";

-- AlterTable
ALTER TABLE "EmailServiceConfig" DROP CONSTRAINT "EmailServiceConfig_pkey",
DROP COLUMN "projectId",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "EmailServiceConfig_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "EmailServiceConfigAndSender" (
    "configId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "EmailServiceConfigAndSender_pkey" PRIMARY KEY ("configId","username","domain")
);

-- CreateTable
CREATE TABLE "_EmailDomainToEmailServiceConfig" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EmailDomainToEmailServiceConfig_AB_unique" ON "_EmailDomainToEmailServiceConfig"("A", "B");

-- CreateIndex
CREATE INDEX "_EmailDomainToEmailServiceConfig_B_index" ON "_EmailDomainToEmailServiceConfig"("B");

-- AddForeignKey
ALTER TABLE "EmailServiceConfig" ADD CONSTRAINT "EmailServiceConfig_id_fkey" FOREIGN KEY ("id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfigAndSender" ADD CONSTRAINT "EmailServiceConfigAndSender_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EmailServiceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfigAndSender" ADD CONSTRAINT "EmailServiceConfigAndSender_username_domain_fkey" FOREIGN KEY ("username", "domain") REFERENCES "EmailSender"("username", "domain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailDomainToEmailServiceConfig" ADD CONSTRAINT "_EmailDomainToEmailServiceConfig_A_fkey" FOREIGN KEY ("A") REFERENCES "EmailDomain"("domain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailDomainToEmailServiceConfig" ADD CONSTRAINT "_EmailDomainToEmailServiceConfig_B_fkey" FOREIGN KEY ("B") REFERENCES "EmailServiceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
