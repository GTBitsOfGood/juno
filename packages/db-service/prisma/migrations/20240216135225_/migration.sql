/*
  Warnings:

  - You are about to drop the column `environment` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `userVisible` on the `ApiKey` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApiScope" AS ENUM ('FULL');

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "environment",
DROP COLUMN "userVisible",
ADD COLUMN     "scopes" "ApiScope"[];
