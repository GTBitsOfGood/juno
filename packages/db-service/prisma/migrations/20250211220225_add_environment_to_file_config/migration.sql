/*
  Warnings:

  - The primary key for the `FileServiceBucket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FileServiceConfig` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FileServiceFile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `type` to the `FileProvider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configEnv` to the `FileServiceBucket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configEnv` to the `FileServiceFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileProviderType" AS ENUM ('S3', 'AZURE');

-- DropForeignKey
ALTER TABLE "FileServiceBucket" DROP CONSTRAINT "FileServiceBucket_configId_fkey";

-- DropForeignKey
ALTER TABLE "FileServiceFile" DROP CONSTRAINT "FileServiceFile_bucketName_configId_fkey";

-- DropForeignKey
ALTER TABLE "FileServiceFile" DROP CONSTRAINT "FileServiceFile_configId_fkey";

-- AlterTable
ALTER TABLE "FileProvider" ADD COLUMN     "type" "FileProviderType" NOT NULL;

-- AlterTable
ALTER TABLE "FileServiceBucket" DROP CONSTRAINT "FileServiceBucket_pkey",
ADD COLUMN     "configEnv" TEXT NOT NULL,
ADD CONSTRAINT "FileServiceBucket_pkey" PRIMARY KEY ("name", "configId", "configEnv");

-- AlterTable
ALTER TABLE "FileServiceConfig" DROP CONSTRAINT "FileServiceConfig_pkey",
ADD COLUMN     "environment" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "FileServiceConfig_pkey" PRIMARY KEY ("id", "environment");

-- AlterTable
ALTER TABLE "FileServiceFile" DROP CONSTRAINT "FileServiceFile_pkey",
ADD COLUMN     "configEnv" TEXT NOT NULL,
ADD CONSTRAINT "FileServiceFile_pkey" PRIMARY KEY ("path", "bucketName", "configId", "configEnv");

-- AddForeignKey
ALTER TABLE "FileServiceBucket" ADD CONSTRAINT "FileServiceBucket_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "FileServiceConfig"("id", "environment") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceFile" ADD CONSTRAINT "FileServiceFile_bucketName_configId_configEnv_fkey" FOREIGN KEY ("bucketName", "configId", "configEnv") REFERENCES "FileServiceBucket"("name", "configId", "configEnv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileServiceFile" ADD CONSTRAINT "FileServiceFile_configId_configEnv_fkey" FOREIGN KEY ("configId", "configEnv") REFERENCES "FileServiceConfig"("id", "environment") ON DELETE RESTRICT ON UPDATE CASCADE;
