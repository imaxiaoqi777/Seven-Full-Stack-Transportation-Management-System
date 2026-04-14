import { LoadStatus, Role } from "@prisma/client"

import { prisma } from "@/lib/db"

const ACTIVE_LOAD_STATUSES = [LoadStatus.ASSIGNED, LoadStatus.IN_TRANSIT, LoadStatus.DELIVERED]
const DASHBOARD_STATUS_ORDER = [
  LoadStatus.DRAFT,
  LoadStatus.ASSIGNED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.DELIVERED,
  LoadStatus.COMPLETED,
  LoadStatus.CANCELLED,
]

function getAccessibleLoadWhere(currentUserId: string, currentUserRole: Role) {
  if (currentUserRole === Role.ADMIN) {
    return {}
  }

  return {
    operatorUserId: currentUserId,
  }
}

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0
  }

  return Number(value)
}

export async function getDashboardOverview(currentUserId: string, currentUserRole: Role) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const accessibleLoadWhere = getAccessibleLoadWhere(currentUserId, currentUserRole)

  const [totalLoads, monthLoads, activeVehicleRows, recentLoads, statusGroups, feeAggregate] =
    await Promise.all([
      prisma.load.count({ where: accessibleLoadWhere }),
      prisma.load.count({
        where: {
          ...accessibleLoadWhere,
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      }),
      prisma.load.findMany({
        where: {
          ...accessibleLoadWhere,
          status: { in: ACTIVE_LOAD_STATUSES },
        },
        distinct: ["vehicleId"],
        select: {
          vehicleId: true,
        },
      }),
      prisma.load.findMany({
        where: accessibleLoadWhere,
        orderBy: [{ updatedAt: "desc" }],
        take: 6,
        select: {
          id: true,
          loadNumber: true,
          destination: true,
          status: true,
          updatedAt: true,
          vehicle: {
            select: {
              plateNumber: true,
            },
          },
          operatorUser: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.load.groupBy({
        by: ["status"],
        where: accessibleLoadWhere,
        _count: {
          status: true,
        },
      }),
      prisma.load.aggregate({
        where: accessibleLoadWhere,
        _sum: {
          totalFee: true,
          gasFee: true,
          driverPay: true,
          otherFee: true,
          balanceFee: true,
        },
      }),
    ])

  const statusCountMap = new Map(statusGroups.map((item) => [item.status, item._count.status]))

  return {
    totalLoads,
    monthLoads,
    activeVehicleCount: activeVehicleRows.length,
    balanceFeeTotal: toNumber(feeAggregate._sum.balanceFee),
    feeSummary: {
      totalFee: toNumber(feeAggregate._sum.totalFee),
      gasFee: toNumber(feeAggregate._sum.gasFee),
      driverPay: toNumber(feeAggregate._sum.driverPay),
      otherFee: toNumber(feeAggregate._sum.otherFee),
      balanceFee: toNumber(feeAggregate._sum.balanceFee),
    },
    recentLoads,
    statusSummary: DASHBOARD_STATUS_ORDER.map((status) => ({
      status,
      count: statusCountMap.get(status) ?? 0,
    })),
  }
}
