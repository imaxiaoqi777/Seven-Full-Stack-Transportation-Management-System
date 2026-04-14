"use server"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth-config"
import { hasPermission } from "@/lib/permissions"
import { createOperationLog, OperationAction, OperationModule } from "@/lib/operation-logs/service"
import { generateMysqlFullDump } from "@/lib/backup/mysql-sql-dump"

function buildBackupFilename() {
  const stamp = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const local = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(
    stamp.getHours()
  )}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`
  return `container-transport-backup-${local}.sql`
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录。" }, { status: 401 })
  }

  if (session.user.status === "DISABLED") {
    return NextResponse.json({ message: "账号已被禁用。" }, { status: 403 })
  }

  if (!hasPermission(session.user.role, "operation-logs")) {
    return NextResponse.json({ message: "无权限执行数据库备份。" }, { status: 403 })
  }

  try {
    const filename = buildBackupFilename()
    const sql = await generateMysqlFullDump()

    const backupModule = (OperationModule as unknown as Record<string, string | undefined>)
      .DATABASE_BACKUP

    if (backupModule) {
      try {
        await createOperationLog({
          actor: {
            id: session.user.id,
            username: session.user.username,
            account: session.user.account,
          },
          action: OperationAction.CREATE,
          module: backupModule as unknown as typeof OperationModule.DATABASE_BACKUP,
          summary: `导出全库 SQL 备份文件：${filename}`,
        })
      } catch {
        // If Prisma Client hasn't been regenerated yet, don't block the download.
      }
    }

    return new NextResponse(sql, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败。"
    return NextResponse.json({ message }, { status: 500 })
  }
}

