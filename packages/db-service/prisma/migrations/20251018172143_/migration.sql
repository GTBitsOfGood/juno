-- CreateTable
CREATE TABLE "AnalyticsServiceConfig" (
    "id" INTEGER NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'test',
    "analyticsKey" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AnalyticsServiceConfig_pkey" PRIMARY KEY ("id","environment")
);
