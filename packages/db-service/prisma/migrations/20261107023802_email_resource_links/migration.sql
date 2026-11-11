-- AlterTable
ALTER TABLE "EmailServiceConfigAndDomain" ADD COLUMN     "sendgridId" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing links take the SendGrid id already saved on their domain row,
UPDATE "EmailServiceConfigAndDomain" AS link
SET "sendgridId" = domain."sendgridId"
FROM "EmailDomain" AS domain
WHERE domain."domain" = link."domainStr";

-- CreateTable
CREATE TABLE "EmailVerifiedSender" (
    "configId" INTEGER NOT NULL,
    "configEnv" TEXT NOT NULL,
    "sendgridId" INTEGER NOT NULL,
    "fromEmail" TEXT NOT NULL,

    CONSTRAINT "EmailVerifiedSender_pkey" PRIMARY KEY ("configId","configEnv","sendgridId")
);

-- AddForeignKey
ALTER TABLE "EmailVerifiedSender" ADD CONSTRAINT "EmailVerifiedSender_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "EmailServiceConfig"("id", "environment") ON DELETE RESTRICT ON UPDATE CASCADE;
