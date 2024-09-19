-- CreateTable
CREATE TABLE "EmailDomain" (
    "domain" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "sendgridId" INTEGER NOT NULL,

    CONSTRAINT "EmailDomain_pkey" PRIMARY KEY ("domain","projectId")
);
