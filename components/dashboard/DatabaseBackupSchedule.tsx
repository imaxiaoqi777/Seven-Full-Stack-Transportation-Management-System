"use client"

import { useEffect, useState } from "react"
import { AlarmClock } from "lucide-react"

import { formatDurationMs, getNextBackupTarget, isBackupReminderDay } from "@/lib/backup/schedule"

function formatTargetDate(d: Date) {
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

type DatabaseBackupScheduleProps = {
  /** 可进入「操作日志」并导出备份的管理员账号 */
  canManageBackup: boolean
}

export function DatabaseBackupSchedule({ canManageBackup }: DatabaseBackupScheduleProps) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(0)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  useEffect(() => {
    try {
      setDismissedKey(sessionStorage.getItem("db-backup-reminder-dismissed"))
    } catch {
      setDismissedKey(null)
    }

    setNow(Date.now())
    setMounted(true)

    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const current = mounted ? new Date(now) : null
  const nextTarget = current ? getNextBackupTarget(current) : null
  const diffMs = mounted && nextTarget ? nextTarget.getTime() - now : 0
  const parts = formatDurationMs(diffMs)

  const todayKey = current
    ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
    : ""

  const showModal =
    mounted &&
    current !== null &&
    isBackupReminderDay(current) &&
    dismissedKey !== todayKey

  function dismissModal() {
    try {
      sessionStorage.setItem("db-backup-reminder-dismissed", todayKey)
    } catch {
      /* ignore */
    }
    setDismissedKey(todayKey)
  }

  const isBackupDay = mounted && current !== null && isBackupReminderDay(current)

  return (
    <>
      <section className="rounded-2xl border border-amber-100 bg-amber-50/90 p-5 shadow-sm ring-1 ring-amber-100/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-100">
              <AlarmClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">月度数据库备份提醒</h2>
              <p className="mt-1 text-sm text-gray-600">
                建议在<strong className="font-medium text-gray-800">每月 1 日</strong>
                导出一次全库 SQL。下次建议备份时点：
                {mounted && nextTarget ? (
                  <span className="font-medium text-gray-800">
                    {" "}
                    {formatTargetDate(nextTarget)} 0:00
                  </span>
                ) : (
                  <span className="font-normal text-gray-500"> （载入后显示具体日期）</span>
                )}
                （本地时间）。
              </p>
              {isBackupDay ? (
                <p className="mt-2 text-sm font-medium text-amber-900">
                  {canManageBackup
                    ? "今天是备份日，请到「操作日志」页导出全库 SQL。"
                    : "今天是备份日，请联系管理员导出全库 SQL 备份。"}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-amber-100 sm:text-left">
            <p className="text-xs font-medium text-gray-500">距离下次 1 日 0 点还有</p>
            <p className="mt-1 min-h-[1.75rem] font-mono text-lg font-semibold tabular-nums text-gray-900">
              {mounted ? (
                <>
                  {parts.days} 天 {String(parts.hours).padStart(2, "0")}:{String(parts.minutes).padStart(2, "0")}:
                  {String(parts.seconds).padStart(2, "0")}
                </>
              ) : (
                <span className="text-base font-normal text-gray-400">载入中…</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {showModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:px-4"
          onClick={dismissModal}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">今日请备份数据库</h3>
            <p className="mt-3 text-sm text-gray-600">
              今天是<strong className="text-gray-900">每月 1 日</strong>。
              {canManageBackup ? (
                <>
                  建议在「操作日志」页面使用
                  <strong className="text-gray-900">「导出全库 SQL」</strong>
                  下载备份文件并妥善保存，以便需要时可导入恢复。
                </>
              ) : (
                <>请联系系统管理员在「操作日志」中导出全库 SQL 并妥善保存。</>
              )}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={dismissModal}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                今日已处理 / 稍后提醒
              </button>
              {canManageBackup ? (
                <a
                  href="/dashboard/operation-logs"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  前往操作日志
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
