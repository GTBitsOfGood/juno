-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('CLICK', 'VISIT', 'INPUT', 'CUSTOM');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "environment" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_event_pagination_idx" ON "AnalyticsEvent"("projectId", "environment", "type", "createdAt" DESC, "id" DESC);
