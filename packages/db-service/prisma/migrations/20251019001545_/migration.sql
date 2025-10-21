/*
  Warnings:

  - The primary key for the `AnalyticsServiceConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `projectId` on the `AnalyticsServiceConfig` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnalyticsServiceConfig" DROP CONSTRAINT "AnalyticsServiceConfig_projectId_fkey";

-- AlterTable
ALTER TABLE "AnalyticsServiceConfig" DROP CONSTRAINT "AnalyticsServiceConfig_pkey",
DROP COLUMN "projectId",
ADD CONSTRAINT "AnalyticsServiceConfig_pkey" PRIMARY KEY ("id", "environment");

-- AddForeignKey
ALTER TABLE "AnalyticsServiceConfig" ADD CONSTRAINT "AnalyticsServiceConfig_id_fkey" FOREIGN KEY ("id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
