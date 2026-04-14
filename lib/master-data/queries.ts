import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

import { MASTER_DATA_PAGE_SIZE } from "./constants"
import { getPagination } from "./utils"

type ListInput = {
  keyword: string
  page: number
}

export async function getContainerTypeList({ keyword, page }: ListInput) {
  const { skip, take } = getPagination(page)
  const where: Prisma.ContainerTypeWhereInput = keyword
    ? {
        OR: [{ name: { contains: keyword } }, { code: { contains: keyword } }],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.containerType.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        _count: {
          select: {
            loads: true,
          },
        },
      },
    }),
    prisma.containerType.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / MASTER_DATA_PAGE_SIZE)),
  }
}

export async function getCompanyList({ keyword, page }: ListInput) {
  const { skip, take } = getPagination(page)
  const where: Prisma.CompanyWhereInput = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { socialCreditCode: { contains: keyword } },
          { contactName: { contains: keyword } },
          { contactPhone: { contains: keyword } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        _count: {
          select: {
            loads: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / MASTER_DATA_PAGE_SIZE)),
  }
}

export async function getVehiclePlateList({ keyword, page }: ListInput) {
  const { skip, take } = getPagination(page)
  const where: Prisma.VehiclePlateWhereInput = keyword
    ? {
        OR: [
          { plateNumber: { contains: keyword } },
          { vehicleType: { contains: keyword } },
          { teamName: { contains: keyword } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.vehiclePlate.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        _count: {
          select: {
            loads: true,
            defaultDrivers: true,
          },
        },
      },
    }),
    prisma.vehiclePlate.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / MASTER_DATA_PAGE_SIZE)),
  }
}

export async function getDriverList({ keyword, page }: ListInput) {
  const { skip, take } = getPagination(page)
  const where: Prisma.DriverWhereInput = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { phone: { contains: keyword } },
          { defaultVehicle: { is: { plateNumber: { contains: keyword } } } },
          { boundUser: { is: { username: { contains: keyword } } } },
          { boundUser: { is: { account: { contains: keyword } } } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        defaultVehicle: {
          select: {
            id: true,
            plateNumber: true,
          },
        },
        boundUser: {
          select: {
            id: true,
            username: true,
            account: true,
          },
        },
        _count: {
          select: {
            loadsAsDriver: true,
          },
        },
      },
    }),
    prisma.driver.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / MASTER_DATA_PAGE_SIZE)),
  }
}

export async function getDropLocationList({ keyword, page }: ListInput) {
  const { skip, take } = getPagination(page)
  const where: Prisma.DropLocationWhereInput = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { province: { contains: keyword } },
          { city: { contains: keyword } },
          { district: { contains: keyword } },
          { fullAddress: { contains: keyword } },
          { contactName: { contains: keyword } },
          { contactPhone: { contains: keyword } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.dropLocation.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        _count: {
          select: {
            loads: true,
          },
        },
      },
    }),
    prisma.dropLocation.count({ where }),
  ])

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / MASTER_DATA_PAGE_SIZE)),
  }
}

export async function getContainerTypeById(id: string) {
  return prisma.containerType.findUnique({
    where: { id },
  })
}

export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
  })
}

export async function getVehiclePlateById(id: string) {
  return prisma.vehiclePlate.findUnique({
    where: { id },
  })
}

export async function getDriverById(id: string) {
  return prisma.driver.findUnique({
    where: { id },
    include: {
      defaultVehicle: {
        select: {
          id: true,
          plateNumber: true,
        },
      },
      boundUser: {
        select: {
          id: true,
          username: true,
          account: true,
        },
      },
    },
  })
}

export async function getDropLocationById(id: string) {
  return prisma.dropLocation.findUnique({
    where: { id },
  })
}

export async function getVehicleOptions() {
  return prisma.vehiclePlate.findMany({
    orderBy: [{ plateNumber: "asc" }],
    select: {
      id: true,
      plateNumber: true,
    },
  })
}
