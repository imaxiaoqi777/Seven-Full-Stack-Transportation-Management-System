/*
  Warnings:

  - You are about to drop the column `address` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccount` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `drivingLicense` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `idCard` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `licenseExpireDate` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `licenseType` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `qualifications` on the `driver` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `driver` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(4))`.
  - You are about to drop the column `containerId` on the `load` table. All the data in the column will be lost.
  - You are about to drop the column `dropPointId` on the `load` table. All the data in the column will be lost.
  - You are about to drop the column `pickupPointId` on the `load` table. All the data in the column will be lost.
  - You are about to drop the `container` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `droppoint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `containerTypeId` to the `Load` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropLocationId` to the `Load` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocationId` to the `Load` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Driver_drivingLicense_key` ON `driver`;

-- DropIndex
DROP INDEX `Driver_idCard_key` ON `driver`;

-- DropIndex
DROP INDEX `Load_assistantDriverId_fkey` ON `load`;

-- DropIndex
DROP INDEX `Load_containerId_fkey` ON `load`;

-- DropIndex
DROP INDEX `Load_dropPointId_fkey` ON `load`;

-- DropIndex
DROP INDEX `Load_pickupPointId_fkey` ON `load`;

-- DropIndex
DROP INDEX `Load_vehicleId_fkey` ON `load`;

-- DropIndex
DROP INDEX `LoadHistory_changedBy_fkey` ON `loadhistory`;

-- DropIndex
DROP INDEX `User_parentId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `driver`
    DROP COLUMN `address`,
    DROP COLUMN `bankAccount`,
    DROP COLUMN `bankName`,
    DROP COLUMN `drivingLicense`,
    DROP COLUMN `email`,
    DROP COLUMN `emergencyContact`,
    DROP COLUMN `emergencyPhone`,
    DROP COLUMN `idCard`,
    DROP COLUMN `isActive`,
    DROP COLUMN `licenseExpireDate`,
    DROP COLUMN `licenseType`,
    DROP COLUMN `qualifications`,
    ADD COLUMN `defaultVehicleId` VARCHAR(191) NULL,
    ADD COLUMN `remark` TEXT NULL,
    MODIFY `name` VARCHAR(50) NOT NULL,
    MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED';

-- AlterTable
ALTER TABLE `load`
    DROP COLUMN `containerId`,
    DROP COLUMN `dropPointId`,
    DROP COLUMN `pickupPointId`,
    ADD COLUMN `containerTypeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `dropLocationId` VARCHAR(191) NOT NULL,
    ADD COLUMN `pickupLocationId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `container`;

-- DropTable
DROP TABLE `droppoint`;

-- DropTable
DROP TABLE `vehicle`;

-- CreateTable
CREATE TABLE `ContainerType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NULL,
    `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContainerType_code_key`(`code`),
    INDEX `ContainerType_name_idx`(`name`),
    INDEX `ContainerType_status_idx`(`status`),
    INDEX `ContainerType_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehiclePlate` (
    `id` VARCHAR(191) NOT NULL,
    `plateNumber` VARCHAR(20) NOT NULL,
    `vehicleType` VARCHAR(50) NULL,
    `teamName` VARCHAR(50) NULL,
    `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VehiclePlate_plateNumber_key`(`plateNumber`),
    INDEX `VehiclePlate_plateNumber_idx`(`plateNumber`),
    INDEX `VehiclePlate_status_idx`(`status`),
    INDEX `VehiclePlate_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DropLocation` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `province` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `district` VARCHAR(50) NOT NULL,
    `detailAddress` VARCHAR(200) NOT NULL,
    `fullAddress` VARCHAR(255) NOT NULL,
    `contactName` VARCHAR(50) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    `remark` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DropLocation_name_idx`(`name`),
    INDEX `DropLocation_province_city_district_idx`(`province`, `city`, `district`),
    INDEX `DropLocation_status_idx`(`status`),
    INDEX `DropLocation_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Driver_name_idx` ON `Driver`(`name`);

-- CreateIndex
CREATE INDEX `Driver_phone_idx` ON `Driver`(`phone`);

-- CreateIndex
CREATE INDEX `Driver_defaultVehicleId_idx` ON `Driver`(`defaultVehicleId`);

-- CreateIndex
CREATE INDEX `Driver_status_idx` ON `Driver`(`status`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContainerType` ADD CONSTRAINT `ContainerType_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehiclePlate` ADD CONSTRAINT `VehiclePlate_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver` ADD CONSTRAINT `Driver_defaultVehicleId_fkey` FOREIGN KEY (`defaultVehicleId`) REFERENCES `VehiclePlate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Driver` ADD CONSTRAINT `Driver_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DropLocation` ADD CONSTRAINT `DropLocation_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_containerTypeId_fkey` FOREIGN KEY (`containerTypeId`) REFERENCES `ContainerType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `VehiclePlate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_assistantDriverId_fkey` FOREIGN KEY (`assistantDriverId`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_pickupLocationId_fkey` FOREIGN KEY (`pickupLocationId`) REFERENCES `DropLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_dropLocationId_fkey` FOREIGN KEY (`dropLocationId`) REFERENCES `DropLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Load` ADD CONSTRAINT `Load_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoadHistory` ADD CONSTRAINT `LoadHistory_loadId_fkey` FOREIGN KEY (`loadId`) REFERENCES `Load`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoadHistory` ADD CONSTRAINT `LoadHistory_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
