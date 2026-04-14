import mysql from "mysql2/promise"

function quoteId(name: string) {
  return "`" + String(name).replace(/`/g, "``") + "`"
}

function escapeValue(conn: mysql.Connection, value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL"
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "NULL"
    return String(value)
  }

  if (typeof value === "bigint") {
    return String(value)
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0"
  }

  if (value instanceof Date) {
    return conn.escape(value)
  }

  if (Buffer.isBuffer(value)) {
    return `X'${value.toString("hex")}'`
  }

  if (typeof value === "object") {
    try {
      return conn.escape(JSON.stringify(value))
    } catch {
      return conn.escape(String(value))
    }
  }

  return conn.escape(String(value))
}

async function getColumnNames(
  conn: mysql.Connection,
  schema: string,
  table: string
): Promise<string[]> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [schema, table]
  )

  return rows.map((r) => String(r.c))
}

export async function generateMysqlFullDump(): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl?.trim()) {
    throw new Error("未配置 DATABASE_URL，无法连接数据库导出。")
  }

  const conn = await mysql.createConnection(databaseUrl)

  try {
    const [dbRows] = await conn.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS db")
    const schema = dbRows[0]?.db
    if (!schema || typeof schema !== "string") {
      throw new Error("无法获取当前数据库名称。")
    }

    const lines: string[] = []
    lines.push("-- container-transport 全库逻辑备份（INSERT + CREATE）")
    lines.push(`-- 生成时间(UTC): ${new Date().toISOString()}`)
    lines.push(`-- 数据库: ${schema}`)
    lines.push("-- 恢复示例: mysql -u用户名 -p 目标库名 < backup.sql")
    lines.push("")
    lines.push("SET NAMES utf8mb4;")
    lines.push("SET FOREIGN_KEY_CHECKS=0;")
    lines.push("SET UNIQUE_CHECKS=0;")
    lines.push("")

    const [tables] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME AS t
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [schema]
    )

    for (const row of tables) {
      const table = String(row.t)
      lines.push("-- ---------------------------------------------------------")
      lines.push(`-- 表 ${table}`)
      lines.push("-- ---------------------------------------------------------")
      lines.push(`DROP TABLE IF EXISTS ${quoteId(table)};`)

      const [createRows] = await conn.query<mysql.RowDataPacket[]>(`SHOW CREATE TABLE ${quoteId(table)}`)
      const createSql = createRows[0]?.["Create Table"]
      if (typeof createSql !== "string") {
        throw new Error(`无法读取表 ${table} 的建表语句。`)
      }
      lines.push(`${createSql};`)
      lines.push("")

      const columns = await getColumnNames(conn, schema, table)
      if (columns.length === 0) {
        continue
      }

      const [data] = await conn.query<mysql.RowDataPacket[]>(`SELECT * FROM ${quoteId(table)}`)
      if (!data.length) {
        continue
      }

      const colList = columns.map(quoteId).join(", ")
      const batchSize = 200

      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize)
        const valueTuples = chunk.map((r) => {
          const vals = columns.map((c) => escapeValue(conn, r[c]))
          return `(${vals.join(", ")})`
        })
        lines.push(`INSERT INTO ${quoteId(table)} (${colList}) VALUES`)
        lines.push(`${valueTuples.join(",\n")};`)
        lines.push("")
      }
    }

    lines.push("SET UNIQUE_CHECKS=1;")
    lines.push("SET FOREIGN_KEY_CHECKS=1;")

    return lines.join("\n")
  } finally {
    await conn.end()
  }
}
