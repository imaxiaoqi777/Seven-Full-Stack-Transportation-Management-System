/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, RecordStatus, Role } = require("@prisma/client")
const bcryptjs = require("bcryptjs")

const prisma = new PrismaClient()

const ADMIN_ACCOUNT = "admin@example.com"
const ADMIN_PASSWORD = "admin123"
const DRIVER_ACCOUNT = "operator@example.com"
const DRIVER_PASSWORD = "operator123"
const DEFAULT_DRIVER_NAME = "演示司机"
const DEFAULT_DRIVER_PHONE = "13800000001"

async function ensureAdminUser() {
  const existingAdmin = await prisma.user.findUnique({
    where: { account: ADMIN_ACCOUNT },
    select: {
      id: true,
      account: true,
      username: true,
      role: true,
      status: true,
    },
  })

  if (existingAdmin) {
    console.log("管理员账号已存在，跳过创建。")
    return existingAdmin
  }

  const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10)
  const admin = await prisma.user.create({
    data: {
      account: ADMIN_ACCOUNT,
      username: "系统管理员",
      password: hashedPassword,
      role: Role.ADMIN,
      status: RecordStatus.ENABLED,
    },
    select: {
      id: true,
      account: true,
      username: true,
      role: true,
      status: true,
    },
  })

  console.log("管理员账号创建成功。")
  console.log(`账号：${ADMIN_ACCOUNT}`)
  console.log(`密码：${ADMIN_PASSWORD}`)
  console.log(`ID：${admin.id}`)

  return admin
}

async function ensureDriverProfile(adminUserId: string, driverName: string) {
  const existingDriver = await prisma.driver.findFirst({
    where: { name: driverName },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
    },
  })

  if (existingDriver) {
    console.log(`司机资料已存在：${existingDriver.name}`)
    return existingDriver
  }

  const driver = await prisma.driver.create({
    data: {
      name: driverName,
      phone: DEFAULT_DRIVER_PHONE,
      status: RecordStatus.ENABLED,
      createdBy: adminUserId,
      remark: "演示司机资料",
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
    },
  })

  console.log("司机资料创建成功。")
  console.log(`司机：${driver.name}`)
  console.log(`手机号：${driver.phone}`)
  console.log(`ID：${driver.id}`)

  return driver
}

async function ensureDriverUser(driverProfileId: string) {
  const existingDriverUser = await prisma.user.findUnique({
    where: { account: DRIVER_ACCOUNT },
    select: {
      id: true,
      account: true,
      username: true,
      role: true,
      status: true,
      driverProfileId: true,
    },
  })

  if (!existingDriverUser) {
    const hashedPassword = await bcryptjs.hash(DRIVER_PASSWORD, 10)
    const driverUser = await prisma.user.create({
      data: {
        account: DRIVER_ACCOUNT,
        username: DEFAULT_DRIVER_NAME,
        password: hashedPassword,
        role: Role.DRIVER,
        status: RecordStatus.ENABLED,
        driverProfileId,
      },
      select: {
        id: true,
        account: true,
        username: true,
        role: true,
        status: true,
        driverProfileId: true,
      },
    })

    console.log("司机账号创建成功。")
    console.log(`账号：${DRIVER_ACCOUNT}`)
    console.log(`密码：${DRIVER_PASSWORD}`)
    console.log(`ID：${driverUser.id}`)

    return driverUser
  }

  if (existingDriverUser.driverProfileId === driverProfileId && existingDriverUser.role === Role.DRIVER) {
    console.log("司机账号已存在，且已绑定司机资料。")
    return existingDriverUser
  }

  const updatedDriverUser = await prisma.user.update({
    where: { id: existingDriverUser.id },
    data: {
      role: Role.DRIVER,
      driverProfileId,
    },
    select: {
      id: true,
      account: true,
      username: true,
      role: true,
      status: true,
      driverProfileId: true,
    },
  })

  console.log("司机账号已更新并绑定司机资料。")
  console.log(`账号：${updatedDriverUser.account}`)
  console.log(`绑定司机资料：${updatedDriverUser.driverProfileId}`)

  return updatedDriverUser
}

async function main() {
  try {
    console.log("开始写入演示用户数据...")

    const admin = await ensureAdminUser()

    const existingDriverUser = await prisma.user.findUnique({
      where: { account: DRIVER_ACCOUNT },
      select: {
        username: true,
        driverProfileId: true,
        driverProfile: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    const driverName =
      existingDriverUser?.driverProfile?.name ?? existingDriverUser?.username ?? DEFAULT_DRIVER_NAME
    const driverProfile = await ensureDriverProfile(admin.id, driverName)
    const driverUser = await ensureDriverUser(driverProfile.id)

    console.log("种子数据写入完成。")
    console.log(`管理员：${admin.account}`)
    console.log(`司机账号：${driverUser.account}`)
    console.log(`绑定司机：${driverProfile.name}（${driverProfile.phone}）`)
  } catch (error) {
    console.error("种子数据写入失败：", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()