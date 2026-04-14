CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `socialCreditCode` VARCHAR(50) NOT NULL,
    `contactName` VARCHAR(50) NOT NULL,
    `contactPhone` VARCHAR(20) NOT NULL,
    `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Company_socialCreditCode_key`(`socialCreditCode`),
    INDEX `Company_name_idx`(`name`),
    INDEX `Company_socialCreditCode_idx`(`socialCreditCode`),
    INDEX `Company_status_idx`(`status`),
    INDEX `Company_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Load`
    ADD COLUMN `companyId` VARCHAR(191) NULL,
    ADD INDEX `Load_companyId_idx`(`companyId`);

ALTER TABLE `OperationLog`
    MODIFY `module` ENUM(
        'USER_MANAGEMENT',
        'LOAD_MANAGEMENT',
        'CONTAINER_TYPE_MANAGEMENT',
        'COMPANY_MANAGEMENT',
        'VEHICLE_MANAGEMENT',
        'DRIVER_MANAGEMENT',
        'DROP_LOCATION_MANAGEMENT'
    ) NOT NULL;

ALTER TABLE `Company`
    ADD CONSTRAINT `Company_createdBy_fkey`
    FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Load`
    ADD CONSTRAINT `Load_companyId_fkey`
    FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
