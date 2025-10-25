/*
  Warnings:

  - You are about to drop the column `analyticsKey` on the `AnalyticsServiceConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnalyticsServiceConfig" DROP COLUMN "analyticsKey",
ADD COLUMN     "clientAnalyticsKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "serverAnalyticsKey" TEXT NOT NULL DEFAULT '';
