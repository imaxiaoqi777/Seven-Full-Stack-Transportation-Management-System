-- Add one-to-one binding between system driver accounts and driver master data.
ALTER TABLE `user`
    ADD COLUMN `driverProfileId` VARCHAR(191) NULL AFTER `status`;

CREATE UNIQUE INDEX `User_driverProfileId_key` ON `user`(`driverProfileId`);

ALTER TABLE `user`
    ADD CONSTRAINT `User_driverProfileId_fkey`
    FOREIGN KEY (`driverProfileId`) REFERENCES `Driver`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Best-effort backfill: if an existing driver account and a driver master record share
-- the same name uniquely, bind them automatically.
UPDATE `user` AS u
JOIN (
    SELECT `name`, MIN(`id`) AS `id`
    FROM `driver`
    GROUP BY `name`
    HAVING COUNT(*) = 1
) AS d ON d.`name` = u.`username`
SET u.`driverProfileId` = d.`id`
WHERE u.`role` = 'DRIVER'
  AND u.`driverProfileId` IS NULL;