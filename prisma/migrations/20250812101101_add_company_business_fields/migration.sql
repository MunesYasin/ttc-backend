/*
  Warnings:

  - A unique constraint covering the columns `[notionalId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commercialRegistrationNumber]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taxNumber]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameOfAuthorizedSignatory]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailOfAuthorizedSignatory]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobileOfAuthorizedSignatory]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager1Name]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager1Email]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager1Mobile]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager2Name]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager2Email]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hrManager2Mobile]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountantName]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountantEmail]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountantMobile]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountantEmail` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountantMobile` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountantName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commercialRegistrationNumber` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailOfAuthorizedSignatory` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager1Email` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager1Mobile` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager1Name` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager2Email` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager2Mobile` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hrManager2Name` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileOfAuthorizedSignatory` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameOfAuthorizedSignatory` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notionalId` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxNumber` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `company` ADD COLUMN `accountantEmail` VARCHAR(191) NOT NULL,
    ADD COLUMN `accountantMobile` VARCHAR(191) NOT NULL,
    ADD COLUMN `accountantName` VARCHAR(191) NOT NULL,
    ADD COLUMN `address` VARCHAR(191) NOT NULL,
    ADD COLUMN `commercialRegistrationNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `emailOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager1Email` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager1Mobile` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager1Name` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager2Email` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager2Mobile` VARCHAR(191) NOT NULL,
    ADD COLUMN `hrManager2Name` VARCHAR(191) NOT NULL,
    ADD COLUMN `mobileOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    ADD COLUMN `nameOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    ADD COLUMN `notionalId` VARCHAR(191) NOT NULL,
    ADD COLUMN `taxNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_notionalId_key` ON `Company`(`notionalId`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_commercialRegistrationNumber_key` ON `Company`(`commercialRegistrationNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_taxNumber_key` ON `Company`(`taxNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_address_key` ON `Company`(`address`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_nameOfAuthorizedSignatory_key` ON `Company`(`nameOfAuthorizedSignatory`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_emailOfAuthorizedSignatory_key` ON `Company`(`emailOfAuthorizedSignatory`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_mobileOfAuthorizedSignatory_key` ON `Company`(`mobileOfAuthorizedSignatory`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager1Name_key` ON `Company`(`hrManager1Name`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager1Email_key` ON `Company`(`hrManager1Email`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager1Mobile_key` ON `Company`(`hrManager1Mobile`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager2Name_key` ON `Company`(`hrManager2Name`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager2Email_key` ON `Company`(`hrManager2Email`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_hrManager2Mobile_key` ON `Company`(`hrManager2Mobile`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_accountantName_key` ON `Company`(`accountantName`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_accountantEmail_key` ON `Company`(`accountantEmail`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_accountantMobile_key` ON `Company`(`accountantMobile`);
