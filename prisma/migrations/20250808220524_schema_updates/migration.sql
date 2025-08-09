/*
  Warnings:

  - You are about to drop the column `workEmail` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_workEmail_idx` ON `user`;

-- DropIndex
DROP INDEX `User_workEmail_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `workEmail`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);
