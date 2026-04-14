ALTER TABLE `Load`
    ADD COLUMN `pickupAt` DATETIME(3) NULL;

CREATE INDEX `Load_pickupAt_idx` ON `Load`(`pickupAt`);
