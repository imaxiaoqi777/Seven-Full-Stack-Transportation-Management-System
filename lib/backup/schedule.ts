/** Next monthly backup anchor: 1st of month at 00:00 local time (strictly after `from` when already past this month's midnight). */
export function getNextBackupTarget(from: Date = new Date()): Date {
  const y = from.getFullYear()
  const m = from.getMonth()
  const thisMonthFirst = new Date(y, m, 1, 0, 0, 0, 0)

  if (from.getTime() < thisMonthFirst.getTime()) {
    return thisMonthFirst
  }

  return new Date(y, m + 1, 1, 0, 0, 0, 0)
}

export function isBackupReminderDay(from: Date = new Date()): boolean {
  return from.getDate() === 1
}

export function formatDurationMs(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds }
}
