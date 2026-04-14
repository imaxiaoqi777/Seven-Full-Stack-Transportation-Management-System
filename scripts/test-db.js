/* eslint-disable @typescript-eslint/no-require-imports */
const pkg = require("@prisma/client")
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log("🔍 正在测试数据库连接...")
    console.log(
      "📍 数据库 URL：",
      process.env.DATABASE_URL?.replace(/:[^@]*@/, ":****@")
    )

    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("✅ 数据库连接成功！")
    console.log("📊 测试查询结果：", result)

    const userCount = await prisma.user.count()
    console.log(`\n📋 当前系统中有 ${userCount} 个用户`)

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          account: true,
          username: true,
          role: true,
          status: true,
          createdAt: true,
        },
      })
      console.log("\n👥 用户列表：")
      console.table(users)
    }
  } catch (error) {
    console.error("❌ 数据库连接失败！")
    console.error("错误信息：", error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
