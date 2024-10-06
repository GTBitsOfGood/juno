/*
  Warnings:

  - The primary key for the `EmailServiceConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EmailServiceConfigAndSender` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_EmailDomainToEmailServiceConfig` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `configEnv` to the `EmailServiceConfigAndSender` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmailServiceConfigAndSender" DROP CONSTRAINT "EmailServiceConfigAndSender_configId_fkey";

-- DropForeignKey
ALTER TABLE "_EmailDomainToEmailServiceConfig" DROP CONSTRAINT "_EmailDomainToEmailServiceConfig_A_fkey";

-- DropForeignKey
ALTER TABLE "_EmailDomainToEmailServiceConfig" DROP CONSTRAINT "_EmailDomainToEmailServiceConfig_B_fkey";

-- AlterTable
ALTER TABLE "EmailServiceConfig" DROP CONSTRAINT "EmailServiceConfig_pkey",
ADD COLUMN     "environment" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sendgridApiKey" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "EmailServiceConfig_pkey" PRIMARY KEY ("id", "environment");

-- AlterTable
ALTER TABLE "EmailServiceConfigAndSender" DROP CONSTRAINT "EmailServiceConfigAndSender_pkey",
ADD COLUMN     "configEnv" TEXT NOT NULL,
ADD CONSTRAINT "EmailServiceConfigAndSender_pkey" PRIMARY KEY ("configId", "configEnv", "username", "domain");

-- DropTable
DROP TABLE "_EmailDomainToEmailServiceConfig";

-- CreateTable
CREATE TABLE "EmailServiceConfigAndDomain" (
    "configId" INTEGER NOT NULL,
    "configEnv" TEXT NOT NULL,
    "domainStr" TEXT NOT NULL,

    CONSTRAINT "EmailServiceConfigAndDomain_pkey" PRIMARY KEY ("configId","configEnv","domainStr")
);

-- AddForeignKey
ALTER TABLE "EmailServiceConfigAndSender" ADD CONSTRAINT "EmailServiceConfigAndSender_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "EmailServiceConfig"("id", "environment") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfigAndDomain" ADD CONSTRAINT "EmailServiceConfigAndDomain_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "EmailServiceConfig"("id", "environment") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceConfigAndDomain" ADD CONSTRAINT "EmailServiceConfigAndDomain_domainStr_fkey" FOREIGN KEY ("domainStr") REFERENCES "EmailDomain"("domain") ON DELETE RESTRICT ON UPDATE CASCADE;
