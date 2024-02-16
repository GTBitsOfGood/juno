/*
  Warnings:

  - You are about to drop the column `hash` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `environment` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uuid` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_hash_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "hash",
ADD COLUMN     "environment" TEXT NOT NULL,
ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_uuid_key" ON "ApiKey"("uuid");
