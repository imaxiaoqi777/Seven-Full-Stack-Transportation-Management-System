UPDATE `user`
SET `username` = '演示司机'
WHERE `account` = 'operator@example.com'
  AND `role` = 'DRIVER'
  AND `username` IN ('操作员', '运营操作员');