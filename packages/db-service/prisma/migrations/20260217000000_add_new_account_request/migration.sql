-- CreateTable
CREATE TABLE "NewAccountRequest" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" "Role" NOT NULL,
    "projectName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewAccountRequest_pkey" PRIMARY KEY ("id")
);
