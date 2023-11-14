/*
  Warnings:

  - Added the required column `environment` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('FULL');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "environment" TEXT NOT NULL,
ADD COLUMN     "scopes" "Scope"[];
