import { LoadStatus } from "@prisma/client"

import type { LoadListFilters } from "./types"

export const LOAD_PAGE_SIZE = 10

export const EMPTY_LOAD_LIST_FILTERS: LoadListFilters = {
  loadNumber: "",
  companyIds: [],
  containerTypeIds: [],
  blNumber: "",
  driverIds: [],
  vehicleIds: [],
  dateFrom: "",
  dateTo: "",
}

export const LOAD_STATUS_OPTIONS = [
  { label: "草稿", value: LoadStatus.DRAFT },
  { label: "已派单", value: LoadStatus.ASSIGNED },
  { label: "运输中", value: LoadStatus.IN_TRANSIT },
  { label: "已落箱", value: LoadStatus.DELIVERED },
  { label: "已完成", value: LoadStatus.COMPLETED },
  { label: "已取消", value: LoadStatus.CANCELLED },
]

export const LOAD_NOTICE_MESSAGES: Record<string, string> = {
  created: "运单创建成功。",
  updated: "运单更新成功。",
  deleted: "运单删除成功。",
  "status-updated": "运单状态更新成功。",
}
