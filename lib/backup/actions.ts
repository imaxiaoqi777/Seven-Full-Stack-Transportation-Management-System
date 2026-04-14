"use server"

import { OperationAction, OperationModule } from "@prisma/client"

import { requireModuleAccess } from "@/lib/auth-service"
import { createOperationLog } from "@/lib/operation-logs/service"

import { generateMysqlFullDump } from "./mysql-sql-dump"

function buildBackupFilename() {
  const stamp = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const local = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`
  return `container-transport-backup-${local}.sql`
}

export type ExportFullDatabaseSqlBackupResult =
  | { ok: true; sql: string; filename: string }
  | { ok: false; message: string }

export async function exportFullDatabaseSqlBackupAction(): Promise<ExportFullDatabaseSqlBackupResult> {
  const user = await requireModuleAccess("operation-logs")

  try {
    const sql = await generateMysqlFullDump()
    const filename = buildBackupFilename()

    await createOperationLog({
      actor: {
        id: user.id,
        username: user.username,
        account: user.account,
      },
      action: OperationAction.CREATE,
      module: OperationModule.DATABASE_BACKUP,
      summary: `导出全库 SQL 备份文件：${filename}`,
    })

    return { ok: true, sql, filename }
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出 SQL 失败。"
    return { ok: false, message }
  }
}
