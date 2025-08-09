/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `EmployeeRoles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `absherMobile` VARCHAR(191) NULL,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `contactMobile` VARCHAR(191) NULL,
    ADD COLUMN `contractStartDate` DATETIME(3) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `directManager` VARCHAR(191) NULL,
    ADD COLUMN `employeeId` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `gregorianBirthDate` DATETIME(3) NULL,
    ADD COLUMN `hijriBirthDate` VARCHAR(191) NULL,
    ADD COLUMN `jobTitle` VARCHAR(191) NULL,
    ADD COLUMN `jobTitleId` INTEGER NULL,
    ADD COLUMN `nationalId` VARCHAR(191) NULL,
    ADD COLUMN `personalEmail` VARCHAR(191) NULL,
    ADD COLUMN `remoteWorkDate` DATETIME(3) NULL,
    ADD COLUMN `totalSalary` DOUBLE NULL,
    ADD COLUMN `workEmail` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `EmployeeRoles_name_key` ON `EmployeeRoles`(`name`);

-- CreateIndex
CREATE INDEX `User_nationalId_idx` ON `User`(`nationalId`);

-- CreateIndex
CREATE INDEX `User_employeeId_idx` ON `User`(`employeeId`);
