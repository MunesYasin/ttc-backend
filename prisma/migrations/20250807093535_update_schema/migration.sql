/*
  Warnings:

  - You are about to drop the column `industry` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `company` DROP COLUMN `industry`,
    DROP COLUMN `logoUrl`,
    ADD COLUMN `location` VARCHAR(191) NOT NULL DEFAULT 'الرياض';
