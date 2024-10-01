-- CreateTable
CREATE TABLE "FileServiceConfig" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "FileServiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileProvider" (
    "name" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,

    CONSTRAINT "FileProvider_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "FileServiceBucket" (
    "name" TEXT NOT NULL,
    "configId" INTEGER NOT NULL,
    "fileProviderName" TEXT NOT NULL,

    CONSTRAINT "FileServiceBucket_pkey" PRIMARY KEY ("name","configId")
);

-- CreateTable
CREATE TABLE "FileServiceFile" (
    "path" TEXT NOT NULL,
    "configId" INTEGER NOT NULL,
    "bucketName" TEXT NOT NULL,

    CONSTRAINT "FileServiceFile_pkey" PRIMARY KEY ("path","bucketName","configId")
);

-- AddForeignKey
ALTER TABLE "FileServiceConfig" ADD CONSTRAINT "FileServiceConfig_id_fkey" FOREIGN KEY ("id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceBucket" ADD CONSTRAINT "FileServiceBucket_fileProviderName_fkey" FOREIGN KEY ("fileProviderName") REFERENCES "FileProvider"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceBucket" ADD CONSTRAINT "FileServiceBucket_configId_fkey" FOREIGN KEY ("configId") REFERENCES "FileServiceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceFile" ADD CONSTRAINT "FileServiceFile_bucketName_configId_fkey" FOREIGN KEY ("bucketName", "configId") REFERENCES "FileServiceBucket"("name", "configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceFile" ADD CONSTRAINT "FileServiceFile_configId_fkey" FOREIGN KEY ("configId") REFERENCES "FileServiceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
