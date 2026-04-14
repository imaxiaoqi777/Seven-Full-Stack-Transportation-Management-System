-- Expand enum temporarily so existing OPERATOR data can be converted safely
ALTER TABLE `user`
    MODIFY COLUMN `role` ENUM('ADMIN', 'OPERATOR', 'DRIVER') NOT NULL DEFAULT 'DRIVER';

-- Rename existing operator-role users to driver-role users
UPDATE `user`
SET `role` = 'DRIVER'
WHERE `role` = 'OPERATOR';

-- Refresh the seeded demo username to match the new role name
UPDATE `user`
SET `username` = '演示司机'
WHERE `username` = '运营操作员' AND `role` = 'DRIVER';

-- Remove the legacy OPERATOR enum value
ALTER TABLE `user`
    MODIFY COLUMN `role` ENUM('ADMIN', 'DRIVER') NOT NULL DEFAULT 'DRIVER';