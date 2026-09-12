-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
