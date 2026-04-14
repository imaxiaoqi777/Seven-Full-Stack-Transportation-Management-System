-- Rebuild load tables for phase 6 load management.
-- The local environment had zero rows in `Load` when this migration was created.

DROP TABLE IF EXISTS `LoadHistory`;
DROP TABLE IF EXISTS `Load`;

CREATE TABLE `Load` (
    `id` VARCHAR(191) NOT NULL,
    `loadNumber` VARCHAR(32) NOT NULL,
    `status` ENUM('DRAFT', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `destination` VARCHAR(100) NOT NULL,
    `containerTypeId` VARCHAR(191) NOT NULL,
    `blNumber` VARCHAR(100) NOT NULL,
    `vesselVoyage` VARCHAR(100) NULL,
    `containerNumber` VARCHAR(50) NOT NULL,
    `sealNumber` VARCHAR(50) NULL,
    `dropLocationId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `driverId` VARCHAR(191) NOT NULL,
    `operatorUserId` VARCHAR(191) NOT NULL,
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Load_loadNumber_key`(`loadNumber`),
    INDEX `Load_status_idx`(`status`),
    INDEX `Load_destination_idx`(`destination`),
    INDEX `Load_containerTypeId_idx`(`containerTypeId`),
    INDEX `Load_blNumber_idx`(`blNumber`),
    INDEX `Load_containerNumber_idx`(`containerNumber`),
    INDEX `Load_dropLocationId_idx`(`dropLocationId`),
    INDEX `Load_vehicleId_idx`(`vehicleId`),
    INDEX `Load_driverId_idx`(`driverId`),
    INDEX `Load_operatorUserId_idx`(`operatorUserId`),
    INDEX `Load_createdAt_idx`(`createdAt`),
    INDEX `Load_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoadHistory` (
    `id` VARCHAR(191) NOT NULL,
    `loadId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoadHistory_loadId_idx`(`loadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Load` ADD CONSTRAINT `Load_containerTypeId_fkey` FOREIGN KEY (`containerTypeId`) REFERENCES `ContainerType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Load` ADD CONSTRAINT `Load_dropLocationId_fkey` FOREIGN KEY (`dropLocationId`) REFERENCES `DropLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Load` ADD CONSTRAINT `Load_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `VehiclePlate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Load` ADD CONSTRAINT `Load_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Load` ADD CONSTRAINT `Load_operatorUserId_fkey` FOREIGN KEY (`operatorUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Load` ADD CONSTRAINT `Load_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `LoadHistory` ADD CONSTRAINT `LoadHistory_loadId_fkey` FOREIGN KEY (`loadId`) REFERENCES `Load`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LoadHistory` ADD CONSTRAINT `LoadHistory_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;