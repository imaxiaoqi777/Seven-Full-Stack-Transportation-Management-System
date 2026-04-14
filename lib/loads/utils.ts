import type { LoadStatus } from "@prisma/client"

import { buildListPath, getNoticeMessage as getBaseNoticeMessage } from "@/lib/master-data/utils"

import { EMPTY_LOAD_LIST_FILTERS, LOAD_NOTICE_MESSAGES } from "./constants"
import type {
  LoadListFilters,
  LoadPageSearchParams,
  ResolvedLoadListParams,
} from "./types"

function firstValue(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value ?? undefined
}

function normalizeDateValue(value?: string | string[] | null) {
  const normalized = firstValue(value)?.trim() ?? ""
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ""
}

function normalizeMultiSelectValues(value?: string | string[] | null) {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return Array.from(
    new Set(
      values
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function toValidDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0")
}

export function resolveLoadListFilters(input: {
  loadNumber?: string | string[] | null
  companyIds?: string | string[] | null
  containerTypeIds?: string | string[] | null
  blNumber?: string | string[] | null
  driverIds?: string | string[] | null
  vehicleIds?: string | string[] | null
  dateFrom?: string | string[] | null
  dateTo?: string | string[] | null
}) {
  return {
    loadNumber: (firstValue(input.loadNumber) ?? "").trim(),
    companyIds: normalizeMultiSelectValues(input.companyIds),
    containerTypeIds: normalizeMultiSelectValues(input.containerTypeIds),
    blNumber: (firstValue(input.blNumber) ?? "").trim(),
    driverIds: normalizeMultiSelectValues(input.driverIds),
    vehicleIds: normalizeMultiSelectValues(input.vehicleIds),
    dateFrom: normalizeDateValue(input.dateFrom),
    dateTo: normalizeDateValue(input.dateTo),
  }
}

export function getLoadStatusLabel(status: LoadStatus) {
  switch (status) {
    case "ASSIGNED":
      return "已派单"
    case "IN_TRANSIT":
      return "运输中"
    case "DELIVERED":
      return "已落箱"
    case "COMPLETED":
      return "已完成"
    case "CANCELLED":
      return "已取消"
    default:
      return "草稿"
  }
}

export function getLoadStatusColor(status: LoadStatus) {
  switch (status) {
    case "ASSIGNED":
      return "bg-blue-100 text-blue-700"
    case "IN_TRANSIT":
      return "bg-amber-100 text-amber-700"
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700"
    case "COMPLETED":
      return "bg-slate-100 text-slate-700"
    case "CANCELLED":
      return "bg-rose-100 text-rose-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export function getLoadNoticeMessage(notice?: string) {
  return LOAD_NOTICE_MESSAGES[notice ?? ""] ?? getBaseNoticeMessage(notice) ?? null
}

export function formatLoadAmount(value: number | string | { toString(): string } | null | undefined) {
  const normalized = Number(value ?? 0)

  return `￥${normalized.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatLoadDateTimeLabel(
  value: Date | string | null | undefined,
  fallback = "未填写"
) {
  const date = toValidDate(value)

  if (!date) {
    return fallback
  }

  return date.toLocaleString("zh-CN", { hour12: false })
}

export function formatLoadDateTimeInput(value: Date | string | null | undefined) {
  const date = toValidDate(value)

  if (!date) {
    return ""
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function getLoadListQueryParams(filters: LoadListFilters) {
  return {
    loadNumber: filters.loadNumber || undefined,
    companyIds: filters.companyIds.length > 0 ? filters.companyIds : undefined,
    containerTypeIds: filters.containerTypeIds.length > 0 ? filters.containerTypeIds : undefined,
    blNumber: filters.blNumber || undefined,
    driverIds: filters.driverIds.length > 0 ? filters.driverIds : undefined,
    vehicleIds: filters.vehicleIds.length > 0 ? filters.vehicleIds : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  }
}

export async function resolveLoadListParams(
  searchParams: LoadPageSearchParams
): Promise<ResolvedLoadListParams> {
  const resolved = await searchParams
  const pageValue = Number.parseInt(firstValue(resolved.page) ?? "1", 10)

  return {
    filters: resolveLoadListFilters(resolved),
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    notice: firstValue(resolved.notice),
  }
}

export function buildLoadListPath(
  filters: LoadListFilters = EMPTY_LOAD_LIST_FILTERS,
  page = 1,
  notice?: string
) {
  return buildListPath("/dashboard/loads", {
    ...getLoadListQueryParams(filters),
    page: page > 1 ? page : undefined,
    notice,
  })
}

export function buildLoadExportPath(filters: LoadListFilters = EMPTY_LOAD_LIST_FILTERS) {
  return buildListPath("/dashboard/loads/export", getLoadListQueryParams(filters))
}

export function appendNoticeToPath(pathname: string, notice?: string) {
  const url = new URL(pathname, "http://localhost")

  if (notice) {
    url.searchParams.set("notice", notice)
  } else {
    url.searchParams.delete("notice")
  }

  return `${url.pathname}${url.search}`
}

export function buildLoadNumber(date = new Date()) {
  const randomSuffix = pad(Math.floor(Math.random() * 100), 2)

  return [
    "YD",
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
    randomSuffix,
  ].join("")
}
