import { RecordStatus } from "@prisma/client"

export const MASTER_DATA_PAGE_SIZE = 10

export const RECORD_STATUS_OPTIONS = [
  { label: "启用", value: RecordStatus.ENABLED },
  { label: "禁用", value: RecordStatus.DISABLED },
]

export const DEFAULT_NOTICE_MESSAGES: Record<string, string> = {
  created: "新增成功。",
  updated: "更新成功。",
  deleted: "删除成功。",
  "status-updated": "状态已更新。",
  "in-use": "该数据已被业务单引用，不能直接删除，请改为禁用。",
}