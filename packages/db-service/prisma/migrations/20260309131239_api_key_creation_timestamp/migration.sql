/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `NewAccountRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "NewAccountRequest_email_key" ON "NewAccountRequest"("email");
