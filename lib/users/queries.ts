import { Prisma, RecordStatus, Role } from "@prisma/client"

import { prisma } from "@/lib/db"
import { getPagination } from "@/lib/master-data/utils"

import { USER_PAGE_SIZE } from "./constants"

type UserListInput = {
  keyword: string
  page: number
}

function getUserSearchWhere(keyword: string): Prisma.UserWhereInput {
  if (!keyword) {
    return {}
  }

  const normalizedKeyword = keyword.trim()
  const loweredKeyword = normalizedKeyword.toLowerCase()
  const roleMatches: Role[] = []
  const statusMatches: RecordStatus[] = []

  if (["admin", "管理员"].some((item) => loweredKeyword.includes(item))) {
    roleMatches.push(Role.ADMIN)
  }

  if (["driver", "司机"].some((item) => loweredKeyword.includes(item))) {
    roleMatches.push(Role.DRIVER)
  }

  if (normalizedKeyword.includes("启用")) {
    statusMatches.push(RecordStatus.ENABLED)
  }

  if (normalizedKeyword.includes("禁用")) {
    statusMatches.push(RecordStatus.DISABLED)
  }

  return {
    OR: [
      { username: { contains: normalizedKeyword } },
      { account: { contains: normalizedKeyword } },
      { driverProfile: { is: { name: { contains: normalizedKeyword } } } },
      { driverProfile: { is: { phone: { contains: normalizedKeyword } } } },
      ...roleMatches.map((role) => ({ role })),
      ...statusMatches.map((status) => ({ status })),
    ],
  }
}

export async function getUserList({ keyword, page }: UserListInput) {
  const { skip, take } = getPagination(page)
  const where = getUserSearchWhere(keyword)

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        driverProfile: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
        _count: {
          select: {
            containerTypes: true,
            vehiclePlates: true,
            drivers: true,
            dropLocations: true,
            createdLoads: true,
            operatedLoads: true,
            loadHistory: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / USER_PAGE_SIZE)),
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      account: true,
      role: true,
      status: true,
      driverProfileId: true,
      driverProfile: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getDriverBindingOptions(selectedDriverId?: string, editingUserId?: string) {
  const items = await prisma.driver.findMany({
    where: selectedDriverId
      ? {
          OR: [{ status: RecordStatus.ENABLED }, { id: selectedDriverId }],
        }
      : {
          status: RecordStatus.ENABLED,
        },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      boundUser: {
        select: {
          id: true,
          username: true,
          account: true,
        },
      },
    },
  })

  return items.filter((item) => {
    if (!item.boundUser) {
      return true
    }

    return item.boundUser.id === editingUserId
  })
}