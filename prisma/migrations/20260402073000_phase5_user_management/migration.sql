-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- DropIndex
DROP INDEX `User_parentId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED' AFTER `role`;

-- Backfill status from legacy isActive flag
UPDATE `user`
SET `status` = CASE
    WHEN `isActive` = 1 THEN 'ENABLED'
    ELSE 'DISABLED'
END;

-- Rename user fields and remove obsolete columns
ALTER TABLE `user`
    CHANGE COLUMN `email` `account` VARCHAR(100) NOT NULL,
    CHANGE COLUMN `password` `password` VARCHAR(255) NOT NULL,
    CHANGE COLUMN `name` `username` VARCHAR(50) NOT NULL,
    DROP COLUMN `parentId`,
    DROP COLUMN `company`,
    DROP COLUMN `phone`,
    DROP COLUMN `isActive`;

-- CreateIndex
CREATE UNIQUE INDEX `User_account_key` ON `user`(`account`);

-- CreateIndex
CREATE INDEX `User_username_idx` ON `user`(`username`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `user`(`role`);

-- CreateIndex
CREATE INDEX `User_status_idx` ON `user`(`status`);