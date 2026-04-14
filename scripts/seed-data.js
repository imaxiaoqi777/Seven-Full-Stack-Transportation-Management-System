/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise")
const bcryptjs = require("bcryptjs")
const crypto = require("crypto")

const ADMIN_ACCOUNT = "admin@example.com"
const ADMIN_PASSWORD = "admin123"
const DRIVER_ACCOUNT = "operator@example.com"
const DRIVER_PASSWORD = "operator123"
const DEFAULT_DRIVER_NAME = "演示司机"
const DEFAULT_DRIVER_PHONE = "13800000001"

function createId() {
  return crypto.randomBytes(12).toString("hex")
}

async function ensureAdminUser(connection) {
  const [rows] = await connection.query(
    "SELECT id, account, username, role, status FROM user WHERE account = ? LIMIT 1",
    [ADMIN_ACCOUNT]
  )

  if (rows.length > 0) {
    console.log("ℹ️ 管理员账户已存在，跳过创建")
    return rows[0]
  }

  const password = await bcryptjs.hash(ADMIN_PASSWORD, 10)
  const adminId = createId()

  await connection.query(
    `INSERT INTO user (id, account, username, password, role, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [adminId, ADMIN_ACCOUNT, "系统管理员", password, "ADMIN", "ENABLED"]
  )

  console.log("✅ 管理员账户创建成功！")
  console.log(`📧 账号：${ADMIN_ACCOUNT}`)
  console.log(`🔑 密码：${ADMIN_PASSWORD}`)
  console.log(`👤 ID：${adminId}`)

  return {
    id: adminId,
    account: ADMIN_ACCOUNT,
    username: "系统管理员",
    role: "ADMIN",
    status: "ENABLED",
  }
}

async function ensureDriverProfile(connection, adminId, driverName) {
  const [rows] = await connection.query(
    `SELECT id, name, phone, status
     FROM driver
     WHERE name = ?
     ORDER BY createdAt ASC
     LIMIT 1`,
    [driverName]
  )

  if (rows.length > 0) {
    console.log(`ℹ️ 司机资料已存在：${rows[0].name}`)
    return rows[0]
  }

  const driverId = createId()
  await connection.query(
    `INSERT INTO driver (id, name, phone, status, remark, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [driverId, driverName, DEFAULT_DRIVER_PHONE, "ENABLED", "演示司机资料", adminId]
  )

  console.log("✅ 司机资料创建成功！")
  console.log(`🧑 司机：${driverName}`)
  console.log(`📱 手机号：${DEFAULT_DRIVER_PHONE}`)
  console.log(`🪪 ID：${driverId}`)

  return {
    id: driverId,
    name: driverName,
    phone: DEFAULT_DRIVER_PHONE,
    status: "ENABLED",
  }
}

async function ensureDriverUser(connection, driverProfileId) {
  const [rows] = await connection.query(
    `SELECT id, account, username, role, status, driverProfileId
     FROM user
     WHERE account = ?
     LIMIT 1`,
    [DRIVER_ACCOUNT]
  )

  if (rows.length === 0) {
    const password = await bcryptjs.hash(DRIVER_PASSWORD, 10)
    const driverUserId = createId()

    await connection.query(
      `INSERT INTO user (id, account, username, password, role, status, driverProfileId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [driverUserId, DRIVER_ACCOUNT, DEFAULT_DRIVER_NAME, password, "DRIVER", "ENABLED", driverProfileId]
    )

    console.log("✅ 司机账户创建成功！")
    console.log(`📧 账号：${DRIVER_ACCOUNT}`)
    console.log(`🔑 密码：${DRIVER_PASSWORD}`)
    console.log(`👤 ID：${driverUserId}`)

    return {
      id: driverUserId,
      account: DRIVER_ACCOUNT,
      username: DEFAULT_DRIVER_NAME,
      role: "DRIVER",
      status: "ENABLED",
      driverProfileId,
    }
  }

  const currentUser = rows[0]
  if (currentUser.role === "DRIVER" && currentUser.driverProfileId === driverProfileId) {
    console.log("ℹ️ 司机账户已存在，且已绑定司机资料")
    return currentUser
  }

  await connection.query(
    `UPDATE user
     SET role = ?, driverProfileId = ?, updatedAt = NOW()
     WHERE id = ?`,
    ["DRIVER", driverProfileId, currentUser.id]
  )

  console.log("✅ 司机账户已更新并绑定司机资料！")

  return {
    ...currentUser,
    role: "DRIVER",
    driverProfileId,
  }
}

async function seedData() {
  let connection

  try {
    console.log("🌱 开始生成种子数据...")

    connection = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "123456",
      database: "container_transport",
    })

    console.log("✅ 数据库连接成功！")

    const admin = await ensureAdminUser(connection)

    const [driverUserRows] = await connection.query(
      `SELECT u.id, u.account, u.username, u.role, u.status, u.driverProfileId,
              d.id AS boundDriverId, d.name AS boundDriverName, d.phone AS boundDriverPhone
       FROM user u
       LEFT JOIN driver d ON d.id = u.driverProfileId
       WHERE u.account = ?
       LIMIT 1`,
      [DRIVER_ACCOUNT]
    )

    const driverName =
      driverUserRows[0]?.boundDriverName || driverUserRows[0]?.username || DEFAULT_DRIVER_NAME
    const driverProfile = await ensureDriverProfile(connection, admin.id, driverName)
    const driverUser = await ensureDriverUser(connection, driverProfile.id)

    const [users] = await connection.query(
      `SELECT id, account, username, role, status, driverProfileId, createdAt
       FROM user
       ORDER BY createdAt DESC`
    )

    console.log("\n👥 系统中的所有用户：")
    console.table(users)

    console.log("\n✨ 种子数据生成完成！")
    console.log(`🧩 演示司机绑定：${driverUser.account} -> ${driverProfile.name}`)
  } catch (error) {
    console.error("❌ 出错了！")
    if (error instanceof Error) {
      console.error("错误信息：", error.message)
    } else {
      console.error("错误：", error)
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

seedData()