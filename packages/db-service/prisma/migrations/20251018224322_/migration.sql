/*
  Warnings:

  - The primary key for the `AnalyticsServiceConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "AnalyticsServiceConfig" DROP CONSTRAINT "AnalyticsServiceConfig_pkey",
ADD CONSTRAINT "AnalyticsServiceConfig_pkey" PRIMARY KEY ("id");
