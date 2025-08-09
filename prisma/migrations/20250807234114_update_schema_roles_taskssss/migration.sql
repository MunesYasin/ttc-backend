/*
  Warnings:

  - You are about to drop the column `userId` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitleId` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `hijriBirthDate` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_userId_fkey`;

-- DropIndex
DROP INDEX `Task_userId_idx` ON `task`;

-- DropIndex
DROP INDEX `User_email_idx` ON `user`;

-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- DropIndex
DROP INDEX `User_employeeId_idx` ON `user`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `email`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `jobTitle`,
    DROP COLUMN `jobTitleId`,
    MODIFY `hijriBirthDate` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `AttendanceTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendanceRecordId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceTask_attendanceRecordId_idx`(`attendanceRecordId`),
    INDEX `AttendanceTask_taskId_idx`(`taskId`),
    UNIQUE INDEX `AttendanceTask_attendanceRecordId_taskId_key`(`attendanceRecordId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AttendanceTask` ADD CONSTRAINT `AttendanceTask_attendanceRecordId_fkey` FOREIGN KEY (`attendanceRecordId`) REFERENCES `AttendanceRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceTask` ADD CONSTRAINT `AttendanceTask_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
