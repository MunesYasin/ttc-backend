/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- Add email column as nullable first
ALTER TABLE `User` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `employeeId` VARCHAR(191) NULL,
    ADD COLUMN `jobTitle` VARCHAR(191) NULL,
    ADD COLUMN `jobTitleId` INTEGER NULL;

-- Update existing users with email values based on their personalEmail or workEmail
UPDATE `User` SET `email` = COALESCE(`personalEmail`, `workEmail`, CONCAT('user', `id`, '@temp.com')) WHERE `email` IS NULL;

-- Now make email NOT NULL
ALTER TABLE `User` MODIFY COLUMN `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_employeeId_idx` ON `User`(`employeeId`);
