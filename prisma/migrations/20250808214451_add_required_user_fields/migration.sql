/*
  Warnings:

  - You are about to drop the column `email` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitleId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nationalId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[absherMobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contactMobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[personalEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timezone` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `absherMobile` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactMobile` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contractStartDate` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `department` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `directManager` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gregorianBirthDate` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hijriBirthDate` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nationalId` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `personalEmail` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `remoteWorkDate` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalSalary` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workEmail` on table `user` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update existing NULL values with defaults to avoid constraint failures
UPDATE `user` SET 
  `companyId` = 1 WHERE `companyId` IS NULL;

UPDATE `user` SET 
  `timezone` = 'Asia/Riyadh' WHERE `timezone` IS NULL;

UPDATE `user` SET 
  `absherMobile` = CONCAT('0000000', `id`) WHERE `absherMobile` IS NULL;

UPDATE `user` SET 
  `address` = 'Not Provided' WHERE `address` IS NULL;

UPDATE `user` SET 
  `contactMobile` = CONCAT('0555000', LPAD(`id`, 3, '0')) WHERE `contactMobile` IS NULL;

UPDATE `user` SET 
  `contractStartDate` = NOW() WHERE `contractStartDate` IS NULL;

UPDATE `user` SET 
  `department` = 'General' WHERE `department` IS NULL;

UPDATE `user` SET 
  `directManager` = 'TBD' WHERE `directManager` IS NULL;

UPDATE `user` SET 
  `gender` = 'Not Specified' WHERE `gender` IS NULL;

UPDATE `user` SET 
  `gregorianBirthDate` = '1990-01-01 00:00:00' WHERE `gregorianBirthDate` IS NULL;

UPDATE `user` SET 
  `hijriBirthDate` = '1410-05-10 00:00:00' WHERE `hijriBirthDate` IS NULL;

UPDATE `user` SET 
  `nationalId` = CONCAT('100000', LPAD(`id`, 4, '0')) WHERE `nationalId` IS NULL;

UPDATE `user` SET 
  `personalEmail` = CONCAT('user', `id`, '@personal.temp') WHERE `personalEmail` IS NULL;

UPDATE `user` SET 
  `remoteWorkDate` = NOW() WHERE `remoteWorkDate` IS NULL;

UPDATE `user` SET 
  `totalSalary` = 5000.0 WHERE `totalSalary` IS NULL;

UPDATE `user` SET 
  `workEmail` = CONCAT('user', `id`, '@company.temp') WHERE `workEmail` IS NULL;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_companyId_fkey`;

-- DropIndex
DROP INDEX `User_email_idx` ON `user`;

-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- DropIndex
DROP INDEX `User_employeeId_idx` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `email`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `jobTitle`,
    DROP COLUMN `jobTitleId`,
    MODIFY `companyId` INTEGER NOT NULL,
    MODIFY `timezone` VARCHAR(191) NOT NULL,
    MODIFY `absherMobile` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL,
    MODIFY `contactMobile` VARCHAR(191) NOT NULL,
    MODIFY `contractStartDate` DATETIME(3) NOT NULL,
    MODIFY `department` VARCHAR(191) NOT NULL,
    MODIFY `directManager` VARCHAR(191) NOT NULL,
    MODIFY `gender` VARCHAR(191) NOT NULL,
    MODIFY `gregorianBirthDate` DATETIME(3) NOT NULL,
    MODIFY `hijriBirthDate` DATETIME(3) NOT NULL,
    MODIFY `nationalId` VARCHAR(191) NOT NULL,
    MODIFY `personalEmail` VARCHAR(191) NOT NULL,
    MODIFY `remoteWorkDate` DATETIME(3) NOT NULL,
    MODIFY `totalSalary` DOUBLE NOT NULL,
    MODIFY `workEmail` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_nationalId_key` ON `User`(`nationalId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_absherMobile_key` ON `User`(`absherMobile`);

-- CreateIndex
CREATE UNIQUE INDEX `User_contactMobile_key` ON `User`(`contactMobile`);

-- CreateIndex
CREATE UNIQUE INDEX `User_personalEmail_key` ON `User`(`personalEmail`);

-- CreateIndex
CREATE UNIQUE INDEX `User_workEmail_key` ON `User`(`workEmail`);

-- CreateIndex
CREATE INDEX `User_workEmail_idx` ON `User`(`workEmail`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_companyId_fkey`;

-- DropIndex
DROP INDEX `User_email_idx` ON `user`;

-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- DropIndex
DROP INDEX `User_employeeId_idx` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `email`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `jobTitle`,
    DROP COLUMN `jobTitleId`,
    MODIFY `companyId` INTEGER NOT NULL,
    MODIFY `timezone` VARCHAR(191) NOT NULL,
    MODIFY `absherMobile` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL,
    MODIFY `contactMobile` VARCHAR(191) NOT NULL,
    MODIFY `contractStartDate` DATETIME(3) NOT NULL,
    MODIFY `department` VARCHAR(191) NOT NULL,
    MODIFY `directManager` VARCHAR(191) NOT NULL,
    MODIFY `gender` VARCHAR(191) NOT NULL,
    MODIFY `gregorianBirthDate` DATETIME(3) NOT NULL,
    MODIFY `hijriBirthDate` DATETIME(3) NOT NULL,
    MODIFY `nationalId` VARCHAR(191) NOT NULL,
    MODIFY `personalEmail` VARCHAR(191) NOT NULL,
    MODIFY `remoteWorkDate` DATETIME(3) NOT NULL,
    MODIFY `totalSalary` DOUBLE NOT NULL,
    MODIFY `workEmail` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_nationalId_key` ON `User`(`nationalId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_absherMobile_key` ON `User`(`absherMobile`);

-- CreateIndex
CREATE UNIQUE INDEX `User_contactMobile_key` ON `User`(`contactMobile`);

-- CreateIndex
CREATE UNIQUE INDEX `User_personalEmail_key` ON `User`(`personalEmail`);

-- CreateIndex
CREATE UNIQUE INDEX `User_workEmail_key` ON `User`(`workEmail`);

-- CreateIndex
CREATE INDEX `User_workEmail_idx` ON `User`(`workEmail`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
