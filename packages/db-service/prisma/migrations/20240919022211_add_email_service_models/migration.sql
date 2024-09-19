/*
  Warnings:

  - The primary key for the `EmailDomain` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `projectId` on the `EmailDomain` table. All the data in the column will be lost.
  - Added the required column `subdomain` to the `EmailDomain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailDomain" DROP CONSTRAINT "EmailDomain_pkey",
DROP COLUMN "projectId",
ADD COLUMN     "subdomain" TEXT NOT NULL,
ADD CONSTRAINT "EmailDomain_pkey" PRIMARY KEY ("domain");

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "emailDomainDomain" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_emailDomainDomain_fkey" FOREIGN KEY ("emailDomainDomain") REFERENCES "EmailDomain"("domain") ON DELETE SET NULL ON UPDATE CASCADE;
