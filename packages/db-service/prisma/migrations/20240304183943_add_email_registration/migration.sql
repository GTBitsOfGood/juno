-- CreateTable
CREATE TABLE "Email" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("name","projectId")
);

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
