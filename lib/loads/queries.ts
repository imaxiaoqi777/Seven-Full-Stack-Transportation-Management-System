import { Prisma, RecordStatus, Role } from "@prisma/client"

import { prisma } from "@/lib/db"
import { getPagination } from "@/lib/master-data/utils"

import { LOAD_PAGE_SIZE } from "./constants"
import type {
  LoadFilterCompanyOption,
  LoadFilterContainerTypeOption,
  LoadFilterDriverOption,
  LoadFilterVehicleOption,
  LoadListFilters,
} from "./types"

type LoadListInput = {
  filters: LoadListFilters
  page: number
  currentUserId: string
  currentUserRole: Role
}

type LoadExportInput = {
  filters: LoadListFilters
  currentUserId: string
  currentUserRole: Role
}

type LoadOptionSelectedIds = {
  companyId?: string | null
  containerTypeId?: string
  dropLocationId?: string
  driverId?: string
  vehicleId?: string
  operatorUserId?: string
}

const loadListInclude = {
  company: {
    select: {
      id: true,
      name: true,
      socialCreditCode: true,
      contactName: true,
      contactPhone: true,
    },
  },
  containerType: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  dropLocation: {
    select: {
      id: true,
      name: true,
      fullAddress: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plateNumber: true,
    },
  },
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
  operatorUser: {
    select: {
      id: true,
      username: true,
      account: true,
      role: true,
    },
  },
} satisfies Prisma.LoadInclude

function getAccessWhere(currentUserId: string, currentUserRole: Role): Prisma.LoadWhereInput {
  if (currentUserRole === Role.ADMIN) {
    return {}
  }

  return {
    operatorUserId: currentUserId,
  }
}

function createDateRangeWhere(dateFrom: string, dateTo: string): Prisma.DateTimeFilter | undefined {
  const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
  const end = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null

  if (start && Number.isNaN(start.getTime())) {
    return undefined
  }

  if (end && Number.isNaN(end.getTime())) {
    return undefined
  }

  if (start && end) {
    const [gte, lte] = start <= end ? [start, end] : [end, start]
    return { gte, lte }
  }

  if (start) {
    return { gte: start }
  }

  if (end) {
    return { lte: end }
  }

  return undefined
}

function getFilterWhere(filters: LoadListFilters): Prisma.LoadWhereInput {
  const conditions: Prisma.LoadWhereInput[] = []

  if (filters.loadNumber) {
    conditions.push({
      loadNumber: { contains: filters.loadNumber },
    })
  }

  if (filters.companyIds.length > 0) {
    conditions.push({
      companyId: { in: filters.companyIds },
    })
  }

  if (filters.containerTypeIds.length > 0) {
    conditions.push({
      containerTypeId: { in: filters.containerTypeIds },
    })
  }

  if (filters.blNumber) {
    conditions.push({
      blNumber: { contains: filters.blNumber },
    })
  }

  if (filters.driverIds.length > 0) {
    conditions.push({
      driverId: { in: filters.driverIds },
    })
  }

  if (filters.vehicleIds.length > 0) {
    conditions.push({
      vehicleId: { in: filters.vehicleIds },
    })
  }

  const pickupAt = createDateRangeWhere(filters.dateFrom, filters.dateTo)
  if (pickupAt) {
    conditions.push({ pickupAt })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}

function buildLoadWhere(
  filters: LoadListFilters,
  currentUserId: string,
  currentUserRole: Role
): Prisma.LoadWhereInput {
  return {
    AND: [getAccessWhere(currentUserId, currentUserRole), getFilterWhere(filters)],
  }
}

function getStatusAwareWhere(selectedId?: string | null) {
  if (selectedId) {
    return {
      OR: [{ status: RecordStatus.ENABLED }, { id: selectedId }],
    }
  }

  return {
    status: RecordStatus.ENABLED,
  }
}

async function getOperatorUserOptions(
  currentUserId: string,
  currentUserRole: Role,
  selectedOperatorUserId?: string
) {
  const baseSelect = {
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
  } satisfies Prisma.UserSelect

  if (currentUserRole === Role.DRIVER) {
    return prisma.user.findMany({
      where: {
        id: currentUserId,
      },
      select: baseSelect,
    })
  }

  const validOptions = await prisma.user.findMany({
    where: {
      role: Role.DRIVER,
      status: RecordStatus.ENABLED,
      driverProfileId: { not: null },
    },
    orderBy: [{ username: "asc" }],
    select: baseSelect,
  })

  if (!selectedOperatorUserId || validOptions.some((item) => item.id === selectedOperatorUserId)) {
    return validOptions
  }

  const selectedOption = await prisma.user.findUnique({
    where: { id: selectedOperatorUserId },
    select: baseSelect,
  })

  return selectedOption ? [selectedOption, ...validOptions] : validOptions
}

export async function getLoadList({
  filters,
  page,
  currentUserId,
  currentUserRole,
}: LoadListInput) {
  const { skip, take } = getPagination(page)
  const where = buildLoadWhere(filters, currentUserId, currentUserRole)

  const [items, total] = await Promise.all([
    prisma.load.findMany({
      where,
      skip,
      take,
      orderBy: [{ pickupAt: "desc" }, { updatedAt: "desc" }],
      include: loadListInclude,
    }),
    prisma.load.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / LOAD_PAGE_SIZE)),
  }
}

export async function getLoadExportList({
  filters,
  currentUserId,
  currentUserRole,
}: LoadExportInput) {
  const where = buildLoadWhere(filters, currentUserId, currentUserRole)

  return prisma.load.findMany({
    where,
    orderBy: [{ pickupAt: "desc" }, { loadNumber: "desc" }],
    include: loadListInclude,
  })
}

export async function getLoadFilterCompanyOptions(
  currentUserId: string,
  currentUserRole: Role
): Promise<LoadFilterCompanyOption[]> {
  return prisma.company.findMany({
    where:
      currentUserRole === Role.ADMIN
        ? undefined
        : {
            loads: {
              some: {
                operatorUserId: currentUserId,
              },
            },
          },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      socialCreditCode: true,
    },
  })
}

export async function getLoadFilterDriverOptions(
  currentUserId: string,
  currentUserRole: Role
): Promise<LoadFilterDriverOption[]> {
  return prisma.driver.findMany({
    where:
      currentUserRole === Role.ADMIN
        ? undefined
        : {
            loadsAsDriver: {
              some: {
                operatorUserId: currentUserId,
              },
            },
          },
    orderBy: [{ name: "asc" }, { phone: "asc" }],
    select: {
      id: true,
      name: true,
      phone: true,
    },
  })
}

export async function getLoadFilterContainerTypeOptions(
  currentUserId: string,
  currentUserRole: Role
): Promise<LoadFilterContainerTypeOption[]> {
  return prisma.containerType.findMany({
    where:
      currentUserRole === Role.ADMIN
        ? undefined
        : {
            loads: {
              some: {
                operatorUserId: currentUserId,
              },
            },
          },
    orderBy: [{ name: "asc" }, { code: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
    },
  })
}

export async function getLoadFilterVehicleOptions(
  currentUserId: string,
  currentUserRole: Role
): Promise<LoadFilterVehicleOption[]> {
  return prisma.vehiclePlate.findMany({
    where:
      currentUserRole === Role.ADMIN
        ? undefined
        : {
            loads: {
              some: {
                operatorUserId: currentUserId,
              },
            },
          },
    orderBy: [{ plateNumber: "asc" }],
    select: {
      id: true,
      plateNumber: true,
      vehicleType: true,
      teamName: true,
    },
  })
}

export async function getLoadById(
  id: string,
  currentUserId: string,
  currentUserRole: Role
) {
  return prisma.load.findFirst({
    where: {
      AND: [{ id }, getAccessWhere(currentUserId, currentUserRole)],
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          socialCreditCode: true,
          contactName: true,
          contactPhone: true,
          status: true,
        },
      },
      containerType: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      dropLocation: {
        select: {
          id: true,
          name: true,
          fullAddress: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      operatorUser: {
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
        },
      },
      createdByUser: {
        select: {
          id: true,
          username: true,
          account: true,
        },
      },
    },
  })
}

export async function getLoadFormOptions(
  currentUserId: string,
  currentUserRole: Role,
  selectedIds: LoadOptionSelectedIds = {}
) {
  const [companies, containerTypes, vehicles, drivers, dropLocations, operatorUsers] = await Promise.all([
    prisma.company.findMany({
      where: getStatusAwareWhere(selectedIds.companyId),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        socialCreditCode: true,
        contactName: true,
        contactPhone: true,
        status: true,
      },
    }),
    prisma.containerType.findMany({
      where: getStatusAwareWhere(selectedIds.containerTypeId),
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
    }),
    prisma.vehiclePlate.findMany({
      where: getStatusAwareWhere(selectedIds.vehicleId),
      orderBy: [{ plateNumber: "asc" }],
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        teamName: true,
        status: true,
      },
    }),
    prisma.driver.findMany({
      where: getStatusAwareWhere(selectedIds.driverId),
      orderBy: [{ name: "asc" }, { phone: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
      },
    }),
    prisma.dropLocation.findMany({
      where: getStatusAwareWhere(selectedIds.dropLocationId),
      orderBy: [{ province: "asc" }, { city: "asc" }, { district: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        fullAddress: true,
        status: true,
      },
    }),
    getOperatorUserOptions(currentUserId, currentUserRole, selectedIds.operatorUserId),
  ])

  return {
    companies,
    containerTypes,
    vehicles,
    drivers,
    dropLocations,
    operatorUsers: operatorUsers.map((item) => ({
      id: item.id,
      username: item.username,
      account: item.account,
      role: item.role,
      status: item.status,
      driverProfileId: item.driverProfileId,
      driverProfileName: item.driverProfile?.name ?? null,
      driverProfilePhone: item.driverProfile?.phone ?? null,
      driverProfileStatus: item.driverProfile?.status ?? null,
    })),
  }
}
