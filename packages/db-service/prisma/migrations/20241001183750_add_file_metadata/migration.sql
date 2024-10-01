/*
  Warnings:

  - Added the required column `metadata` to the `FileServiceFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileServiceFile" ADD COLUMN     "metadata" TEXT NOT NULL;
