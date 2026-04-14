import { RecordStatus, Role } from "@prisma/client"

export const USER_PAGE_SIZE = 10

export const USER_ROLE_OPTIONS = [
  { label: "管理员", value: Role.ADMIN },
  { label: "司机", value: Role.DRIVER },
]

export const USER_STATUS_OPTIONS = [
  { label: "启用", value: RecordStatus.ENABLED },
  { label: "禁用", value: RecordStatus.DISABLED },
]

export const USER_NOTICE_MESSAGES: Record<string, string> = {
  created: "用户创建成功。",
  updated: "用户更新成功。",
  deleted: "用户删除成功。",
  "status-updated": "账号状态已更新。",
  "password-reset": "密码已重置。",
  "account-exists": "账号已存在，请更换后重试。",
  "self-delete-blocked": "不能删除当前登录账号。",
  "self-status-blocked": "不能禁用当前登录账号。",
  "self-role-blocked": "当前登录账号不能把自己改为司机。",
  "last-admin": "系统至少需要保留一个启用中的管理员账号。",
  "in-use": "该用户已关联业务数据，不能直接删除，建议改为禁用。",
}

