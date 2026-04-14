import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

import { OPERATION_LOG_PAGE_SIZE, getOperationActionMatches, getOperationModuleMatches } from "./utils"

type OperationLogListInput = {
  keyword: string
  page: number
}

function getSearchWhere(keyword: string): Prisma.OperationLogWhereInput {
  if (!keyword) {
    return {}
  }

  const normalizedKeyword = keyword.trim()
  const actionMatches = getOperationActionMatches(normalizedKeyword)
  const moduleMatches = getOperationModuleMatches(normalizedKeyword)

  return {
    OR: [
      { actorUsername: { contains: normalizedKeyword } },
      { actorAccount: { contains: normalizedKeyword } },
      { businessId: { contains: normalizedKeyword } },
      { summary: { contains: normalizedKeyword } },
      ...actionMatches.map((action) => ({ action })),
      ...moduleMatches.map((module) => ({ module })),
    ],
  }
}

export async function getOperationLogList({ keyword, page }: OperationLogListInput) {
  const currentPage = Math.max(page, 1)
  const skip = (currentPage - 1) * OPERATION_LOG_PAGE_SIZE
  const take = OPERATION_LOG_PAGE_SIZE
  const where = getSearchWhere(keyword)

  const [items, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        actorId: true,
        actorUsername: true,
        actorAccount: true,
        action: true,
        module: true,
        businessId: true,
        summary: true,
        createdAt: true,
      },
    }),
    prisma.operationLog.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / OPERATION_LOG_PAGE_SIZE)),
  }
}