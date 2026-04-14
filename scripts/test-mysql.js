/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise")

async function testConnection() {
  try {
    console.log("🔍 正在测试 MySQL 数据库连接...")
    console.log("📍 主机：localhost:3306")
    console.log("👤 用户：root")
    console.log("")

    const connection = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "123456",
    })

    console.log("✅ 连接成功！")

    const [rows] = await connection.query("SELECT VERSION() as version")
    console.log(`📊 MySQL 版本：${rows[0].version}`)

    const [databases] = await connection.query("SHOW DATABASES")
    console.log("\n📚 现有数据库：")
    databases.forEach((db) => {
      console.log(`   - ${db.Database}`)
    })

    const dbExists = databases.some((db) => db.Database === "container_transport")
    if (dbExists) {
      console.log("\n✅ 数据库 container_transport 已存在")

      const [tables] = await connection.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "container_transport"'
      )
      console.log(`\n📋 数据库表（共 ${tables.length} 个）：`)
      tables.forEach((table) => {
        console.log(`   - ${table.TABLE_NAME}`)
      })

      const [userTable] = await connection.query(
        "SELECT COUNT(*) as count FROM container_transport.User"
      )
      console.log(`\n👥 User 表中的用户数：${userTable[0].count}`)
    } else {
      console.log("\n⚠️  数据库 container_transport 不存在，需要先创建")
    }

    await connection.end()
    console.log("\n✨ 测试完成！")
  } catch (error) {
    console.error("❌ 连接失败！")
    if (error instanceof Error) {
      console.error("错误信息：", error.message)
    } else {
      console.error("错误：", error)
    }
    process.exit(1)
  }
}

testConnection()
