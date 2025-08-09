-- AlterTable
ALTER TABLE `user` ADD COLUMN `employeeRolesId` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `EmployeeRoles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleTasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `employeeRolesId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_employeeRolesId_fkey` FOREIGN KEY (`employeeRolesId`) REFERENCES `EmployeeRoles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleTasks` ADD CONSTRAINT `RoleTasks_employeeRolesId_fkey` FOREIGN KEY (`employeeRolesId`) REFERENCES `EmployeeRoles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
