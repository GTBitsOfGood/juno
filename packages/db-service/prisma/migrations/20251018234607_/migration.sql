/*
  Warnings:

  - Added the required column `projectId` to the `AnalyticsServiceConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnalyticsServiceConfig" ADD COLUMN     "projectId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "AnalyticsServiceConfig" ADD CONSTRAINT "AnalyticsServiceConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
