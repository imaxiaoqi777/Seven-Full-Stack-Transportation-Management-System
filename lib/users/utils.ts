import { RecordStatus, Role } from "@prisma/client"

import { getNoticeMessage as getBaseNoticeMessage } from "@/lib/master-data/utils"

import { USER_NOTICE_MESSAGES } from "./constants"

export function getUserRoleLabel(role: Role) {
  return role === Role.ADMIN ? "管理员" : "司机"
}

export function getUserRoleColor(role: Role) {
  return role === Role.ADMIN
    ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-700"
}

export function getUserStatusLabel(status: RecordStatus) {
  return status === RecordStatus.ENABLED ? "启用" : "禁用"
}

export function getUserNoticeMessage(notice?: string) {
  return USER_NOTICE_MESSAGES[notice ?? ""] ?? getBaseNoticeMessage(notice) ?? null
}

