/*
  Warnings:

  - You are about to drop the column `uuid` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_uuid_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "uuid",
ADD COLUMN     "hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");
