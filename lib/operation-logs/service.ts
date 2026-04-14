import type { Prisma, PrismaClient } from "@prisma/client"
import { OperationAction, OperationModule } from "@prisma/client"

import { prisma } from "@/lib/db"

type OperationDbClient = PrismaClient | Prisma.TransactionClient

type OperationActor = {
  id: string
  username: string
  account: string
}

type CreateOperationLogInput = {
  actor: OperationActor
  action: OperationAction
  module: OperationModule
  businessId?: string | null
  summary: string
}

type SummaryField = {
  label: string
  value: unknown
}

type ChangeField = {
  label: string
  before: unknown
  after: unknown
}

function normalizeSummaryValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "空"
  }

  if (value instanceof Date) {
    return value.toLocaleString("zh-CN")
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否"
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("、") : "空"
  }

  return String(value)
}

function truncateSummary(summary: string, maxLength = 255) {
  if (summary.length <= maxLength) {
    return summary
  }

  return `${summary.slice(0, maxLength - 1)}…`
}

export function buildSnapshotSummary(fields: SummaryField[]) {
  const parts = fields
    .filter((field) => field.value !== undefined)
    .map((field) => `${field.label}：${normalizeSummaryValue(field.value)}`)

  return truncateSummary(parts.join("；") || "无摘要")
}

export function buildChangeSummary(fields: ChangeField[]) {
  const parts = fields
    .filter((field) => normalizeSummaryValue(field.before) !== normalizeSummaryValue(field.after))
    .map(
      (field) =>
        `${field.label}：${normalizeSummaryValue(field.before)} -> ${normalizeSummaryValue(field.after)}`
    )

  return truncateSummary(parts.join("；") || "未发现关键字段变化。")
}

export async function createOperationLog(
  input: CreateOperationLogInput,
  db: OperationDbClient = prisma
) {
  return db.operationLog.create({
    data: {
      actorId: input.actor.id,
      actorUsername: input.actor.username,
      actorAccount: input.actor.account,
      action: input.action,
      module: input.module,
      businessId: input.businessId ?? null,
      summary: truncateSummary(input.summary),
    },
  })
}

export { OperationAction, OperationModule }