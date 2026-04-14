/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise")

async function createDatabase() {
  try {
    console.log("正在创建数据库（如不存在则自动创建）...")

    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "123456",
    })

    await connection.execute(
      "CREATE DATABASE IF NOT EXISTS container_transport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )

    console.log("数据库 `container_transport` 已就绪。")
    await connection.end()
  } catch (error) {
    console.error("创建数据库失败：", error.message)
    process.exit(1)
  }
}

createDatabase()
