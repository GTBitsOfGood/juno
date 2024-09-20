/*
  Warnings:

  - The primary key for the `EmailSender` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `EmailSender` table. All the data in the column will be lost.
  - Added the required column `username` to the `EmailSender` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailSender" DROP CONSTRAINT "EmailSender_pkey",
DROP COLUMN "name",
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "EmailSender_pkey" PRIMARY KEY ("username", "domain");
