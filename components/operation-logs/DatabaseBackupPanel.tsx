"use client"

import { useState } from "react"
import { DatabaseBackup } from "lucide-react"

export function DatabaseBackupPanel() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function getFilenameFromContentDisposition(header: string | null): string | null {
    if (!header) return null
    const match = /filename=\"?([^\";]+)\"?/i.exec(header)
    return match?.[1] ?? null
  }

  async function handleExport() {
    setError(null)
    setMessage(null)
    setIsPending(true)
    try {
      const resp = await fetch("/api/backup/database", { method: "GET" })
      if (!resp.ok) {
        const data = (await resp.json().catch(() => null)) as { message?: string } | null
        setError(data?.message || `导出失败（HTTP ${resp.status}）。`)
        return
      }

      const disposition = resp.headers.get("content-disposition")
      const filename = getFilenameFromContentDisposition(disposition) ?? "container-transport-backup.sql"
      const blob = await resp.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setMessage(`已生成并下载 ${filename}，并已写入操作日志。`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "导出失败。"
      setError(msg)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
            <DatabaseBackup className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">数据库备份（SQL）</h2>
            <p className="mt-1 text-sm text-gray-600">
              导出当前 MySQL 库的建表与数据为 .sql 文件，可在新环境中执行以恢复访问。数据量大时生成可能需要数秒，请耐心等待。
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isPending}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isPending ? "正在生成…" : "导出全库 SQL"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}
    </div>
  )
}
