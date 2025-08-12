-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE') NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nationalId` VARCHAR(191) NOT NULL,
    `hijriBirthDate` DATETIME(3) NOT NULL,
    `gregorianBirthDate` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `absherMobile` VARCHAR(191) NOT NULL,
    `contactMobile` VARCHAR(191) NOT NULL,
    `personalEmail` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `totalSalary` DOUBLE NOT NULL,
    `contractStartDate` DATETIME(3) NOT NULL,
    `remoteWorkDate` DATETIME(3) NOT NULL,
    `directManager` VARCHAR(191) NOT NULL,
    `companyId` INTEGER NOT NULL,
    `employeeRolesId` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    UNIQUE INDEX `user_nationalId_key`(`nationalId`),
    UNIQUE INDEX `user_absherMobile_key`(`absherMobile`),
    UNIQUE INDEX `user_contactMobile_key`(`contactMobile`),
    UNIQUE INDEX `user_personalEmail_key`(`personalEmail`),
    INDEX `user_companyId_idx`(`companyId`),
    INDEX `user_nationalId_idx`(`nationalId`),
    INDEX `user_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `notionalId` VARCHAR(191) NOT NULL,
    `commercialRegistrationNumber` VARCHAR(191) NOT NULL,
    `taxNumber` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `nameOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    `emailOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    `mobileOfAuthorizedSignatory` VARCHAR(191) NOT NULL,
    `hrManager1Name` VARCHAR(191) NOT NULL,
    `hrManager1Email` VARCHAR(191) NOT NULL,
    `hrManager1Mobile` VARCHAR(191) NOT NULL,
    `hrManager2Name` VARCHAR(191) NOT NULL,
    `hrManager2Email` VARCHAR(191) NOT NULL,
    `hrManager2Mobile` VARCHAR(191) NOT NULL,
    `accountantName` VARCHAR(191) NOT NULL,
    `accountantEmail` VARCHAR(191) NOT NULL,
    `accountantMobile` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT 'الرياض',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_notionalId_key`(`notionalId`),
    UNIQUE INDEX `company_commercialRegistrationNumber_key`(`commercialRegistrationNumber`),
    UNIQUE INDEX `company_taxNumber_key`(`taxNumber`),
    UNIQUE INDEX `company_address_key`(`address`),
    UNIQUE INDEX `company_nameOfAuthorizedSignatory_key`(`nameOfAuthorizedSignatory`),
    UNIQUE INDEX `company_emailOfAuthorizedSignatory_key`(`emailOfAuthorizedSignatory`),
    UNIQUE INDEX `company_mobileOfAuthorizedSignatory_key`(`mobileOfAuthorizedSignatory`),
    UNIQUE INDEX `company_hrManager1Name_key`(`hrManager1Name`),
    UNIQUE INDEX `company_hrManager1Email_key`(`hrManager1Email`),
    UNIQUE INDEX `company_hrManager1Mobile_key`(`hrManager1Mobile`),
    UNIQUE INDEX `company_hrManager2Name_key`(`hrManager2Name`),
    UNIQUE INDEX `company_hrManager2Email_key`(`hrManager2Email`),
    UNIQUE INDEX `company_hrManager2Mobile_key`(`hrManager2Mobile`),
    UNIQUE INDEX `company_accountantName_key`(`accountantName`),
    UNIQUE INDEX `company_accountantEmail_key`(`accountantEmail`),
    UNIQUE INDEX `company_accountantMobile_key`(`accountantMobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employeeroles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `employeeroles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roletasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `employeeRolesId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendancerecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `clockInAt` DATETIME(3) NULL,
    `clockOutAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendancerecord_userId_idx`(`userId`),
    INDEX `attendancerecord_date_idx`(`date`),
    UNIQUE INDEX `attendancerecord_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `duration` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `task_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendancetask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendanceRecordId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendancetask_attendanceRecordId_idx`(`attendanceRecordId`),
    INDEX `attendancetask_taskId_idx`(`taskId`),
    UNIQUE INDEX `attendancetask_attendanceRecordId_taskId_key`(`attendanceRecordId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dailyreport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dailyreport_companyId_idx`(`companyId`),
    INDEX `dailyreport_date_idx`(`date`),
    UNIQUE INDEX `dailyreport_companyId_date_key`(`companyId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_employeeRolesId_fkey` FOREIGN KEY (`employeeRolesId`) REFERENCES `employeeroles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roletasks` ADD CONSTRAINT `roletasks_employeeRolesId_fkey` FOREIGN KEY (`employeeRolesId`) REFERENCES `employeeroles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancerecord` ADD CONSTRAINT `attendancerecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancetask` ADD CONSTRAINT `attendancetask_attendanceRecordId_fkey` FOREIGN KEY (`attendanceRecordId`) REFERENCES `attendancerecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancetask` ADD CONSTRAINT `attendancetask_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dailyreport` ADD CONSTRAINT `dailyreport_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
