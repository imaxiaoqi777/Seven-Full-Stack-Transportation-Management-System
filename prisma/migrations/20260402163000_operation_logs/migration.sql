-- CreateTable
CREATE TABLE `OperationLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorUsername` VARCHAR(50) NOT NULL,
    `actorAccount` VARCHAR(100) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'RESET_PASSWORD') NOT NULL,
    `module` ENUM(
        'USER_MANAGEMENT',
        'LOAD_MANAGEMENT',
        'CONTAINER_TYPE_MANAGEMENT',
        'VEHICLE_MANAGEMENT',
        'DRIVER_MANAGEMENT',
        'DROP_LOCATION_MANAGEMENT'
    ) NOT NULL,
    `businessId` VARCHAR(191) NULL,
    `summary` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OperationLog_actorId_idx`(`actorId`),
    INDEX `OperationLog_action_idx`(`action`),
    INDEX `OperationLog_module_idx`(`module`),
    INDEX `OperationLog_businessId_idx`(`businessId`),
    INDEX `OperationLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OperationLog`
    ADD CONSTRAINT `OperationLog_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;