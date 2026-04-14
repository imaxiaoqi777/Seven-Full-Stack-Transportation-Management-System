"use server"

import { Prisma, RecordStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminAccess } from "@/lib/auth-service"
import { prisma } from "@/lib/db"
import {
  OperationAction,
  OperationModule,
  buildChangeSummary,
  buildSnapshotSummary,
  createOperationLog,
} from "@/lib/operation-logs/service"

import {
  containerTypeSchema,
  companySchema,
  driverSchema,
  dropLocationSchema,
  vehiclePlateSchema,
} from "./schemas"
import type { MasterDataFormState } from "./types"
import {
  buildFullAddress,
  buildListPath,
  emptyToUndefined,
  normalizePlateNumber,
  normalizeSocialCreditCode,
} from "./utils"

const FORM_ERROR_MESSAGE = "请先修正表单错误后再提交。"

function createErrorState(
  errors: Record<string, string[] | undefined>,
  message = FORM_ERROR_MESSAGE
): MasterDataFormState {
  return {
    errors,
    message,
  }
}

function getTextValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? ""
}

function getOptionalTextValue(formData: FormData, key: string) {
  return emptyToUndefined(formData.get(key)?.toString() ?? "")
}

function getUniqueErrorTarget(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return []
  }

  const target = (error.meta as { target?: string[] | string } | undefined)?.target

  if (Array.isArray(target)) {
    return target
  }

  if (typeof target === "string") {
    return [target]
  }

  return []
}

function getRecordStatusLabel(status: RecordStatus) {
  return status === RecordStatus.ENABLED ? "启用" : "禁用"
}

function revalidateMasterDataPath(pathname: string) {
  revalidatePath(pathname)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/companies")
  revalidatePath("/dashboard/companies/new")
  revalidatePath("/dashboard/loads")
  revalidatePath("/dashboard/loads/new")
  revalidatePath("/dashboard/users")
  revalidatePath("/dashboard/users/new")
  revalidatePath("/dashboard/operation-logs")
}

async function getAdminUser() {
  return requireAdminAccess()
}

async function getContainerTypeForLog(id: string) {
  return prisma.containerType.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      remark: true,
    },
  })
}

async function getCompanyForLog(id: string) {
  return prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      socialCreditCode: true,
      contactName: true,
      contactPhone: true,
      status: true,
      remark: true,
    },
  })
}

async function getVehicleForLog(id: string) {
  return prisma.vehiclePlate.findUnique({
    where: { id },
    select: {
      id: true,
      plateNumber: true,
      vehicleType: true,
      teamName: true,
      status: true,
      remark: true,
    },
  })
}

export async function saveCompany(
  _prevState: MasterDataFormState,
  formData: FormData
): Promise<MasterDataFormState> {
  const adminUser = await getAdminUser()
  const id = getOptionalTextValue(formData, "id")
  const validated = companySchema.safeParse({
    name: getTextValue(formData, "name"),
    socialCreditCode: normalizeSocialCreditCode(getTextValue(formData, "socialCreditCode")),
    contactName: getTextValue(formData, "contactName"),
    contactPhone: getTextValue(formData, "contactPhone"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  try {
    if (id) {
      const beforeRecord = await getCompanyForLog(id)
      const updatedRecord = await prisma.company.update({
        where: { id },
        data: validated.data,
        select: {
          id: true,
          name: true,
          socialCreditCode: true,
          contactName: true,
          contactPhone: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.UPDATE,
        module: OperationModule.COMPANY_MANAGEMENT,
        businessId: updatedRecord.id,
        summary: buildChangeSummary([
          { label: "公司名称", before: beforeRecord?.name, after: updatedRecord.name },
          {
            label: "统一社会信用代码",
            before: beforeRecord?.socialCreditCode,
            after: updatedRecord.socialCreditCode,
          },
          { label: "联系人", before: beforeRecord?.contactName, after: updatedRecord.contactName },
          { label: "联系电话", before: beforeRecord?.contactPhone, after: updatedRecord.contactPhone },
          {
            label: "状态",
            before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
            after: getRecordStatusLabel(updatedRecord.status),
          },
          { label: "备注", before: beforeRecord?.remark, after: updatedRecord.remark },
        ]),
      })
    } else {
      const createdRecord = await prisma.company.create({
        data: {
          ...validated.data,
          createdBy: adminUser.id,
        },
        select: {
          id: true,
          name: true,
          socialCreditCode: true,
          contactName: true,
          contactPhone: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.CREATE,
        module: OperationModule.COMPANY_MANAGEMENT,
        businessId: createdRecord.id,
        summary: buildSnapshotSummary([
          { label: "公司名称", value: createdRecord.name },
          { label: "统一社会信用代码", value: createdRecord.socialCreditCode },
          { label: "联系人", value: createdRecord.contactName },
          { label: "联系电话", value: createdRecord.contactPhone },
          { label: "状态", value: getRecordStatusLabel(createdRecord.status) },
          { label: "备注", value: createdRecord.remark },
        ]),
      })
    }
  } catch (error) {
    const targets = getUniqueErrorTarget(error)

    if (targets.some((target) => target.includes("socialCreditCode"))) {
      return createErrorState(
        { socialCreditCode: ["统一社会信用代码已存在。"] },
        "保存失败，请检查统一社会信用代码是否重复。"
      )
    }

    throw error
  }

  const pathname = "/dashboard/companies"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: id ? "updated" : "created" }))
}

async function getDriverForLog(id: string) {
  return prisma.driver.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      remark: true,
      defaultVehicle: {
        select: {
          plateNumber: true,
        },
      },
    },
  })
}

async function getDropLocationForLog(id: string) {
  return prisma.dropLocation.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fullAddress: true,
      contactName: true,
      contactPhone: true,
      status: true,
      remark: true,
    },
  })
}

export async function saveContainerType(
  _prevState: MasterDataFormState,
  formData: FormData
): Promise<MasterDataFormState> {
  const adminUser = await getAdminUser()
  const id = getOptionalTextValue(formData, "id")
  const validated = containerTypeSchema.safeParse({
    name: getTextValue(formData, "name"),
    code: getOptionalTextValue(formData, "code"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  try {
    if (id) {
      const beforeRecord = await getContainerTypeForLog(id)
      const updatedRecord = await prisma.containerType.update({
        where: { id },
        data: validated.data,
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.UPDATE,
        module: OperationModule.CONTAINER_TYPE_MANAGEMENT,
        businessId: updatedRecord.id,
        summary: buildChangeSummary([
          { label: "箱型名称", before: beforeRecord?.name, after: updatedRecord.name },
          { label: "箱型编码", before: beforeRecord?.code, after: updatedRecord.code },
          { label: "状态", before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined, after: getRecordStatusLabel(updatedRecord.status) },
          { label: "备注", before: beforeRecord?.remark, after: updatedRecord.remark },
        ]),
      })
    } else {
      const createdRecord = await prisma.containerType.create({
        data: {
          ...validated.data,
          createdBy: adminUser.id,
        },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.CREATE,
        module: OperationModule.CONTAINER_TYPE_MANAGEMENT,
        businessId: createdRecord.id,
        summary: buildSnapshotSummary([
          { label: "箱型名称", value: createdRecord.name },
          { label: "箱型编码", value: createdRecord.code },
          { label: "状态", value: getRecordStatusLabel(createdRecord.status) },
          { label: "备注", value: createdRecord.remark },
        ]),
      })
    }
  } catch (error) {
    const targets = getUniqueErrorTarget(error)

    if (targets.some((target) => target.includes("code"))) {
      return createErrorState(
        { code: ["箱型编码已存在。"] },
        "保存失败，请检查箱型编码是否重复。"
      )
    }

    throw error
  }

  const pathname = "/dashboard/container-types"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: id ? "updated" : "created" }))
}

export async function saveVehiclePlate(
  _prevState: MasterDataFormState,
  formData: FormData
): Promise<MasterDataFormState> {
  const adminUser = await getAdminUser()
  const id = getOptionalTextValue(formData, "id")
  const validated = vehiclePlateSchema.safeParse({
    plateNumber: normalizePlateNumber(getTextValue(formData, "plateNumber")),
    vehicleType: getOptionalTextValue(formData, "vehicleType"),
    teamName: getOptionalTextValue(formData, "teamName"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  try {
    if (id) {
      const beforeRecord = await getVehicleForLog(id)
      const updatedRecord = await prisma.vehiclePlate.update({
        where: { id },
        data: validated.data,
        select: {
          id: true,
          plateNumber: true,
          vehicleType: true,
          teamName: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.UPDATE,
        module: OperationModule.VEHICLE_MANAGEMENT,
        businessId: updatedRecord.id,
        summary: buildChangeSummary([
          { label: "车牌号", before: beforeRecord?.plateNumber, after: updatedRecord.plateNumber },
          { label: "车辆类型", before: beforeRecord?.vehicleType, after: updatedRecord.vehicleType },
          { label: "车队名称", before: beforeRecord?.teamName, after: updatedRecord.teamName },
          { label: "状态", before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined, after: getRecordStatusLabel(updatedRecord.status) },
          { label: "备注", before: beforeRecord?.remark, after: updatedRecord.remark },
        ]),
      })
    } else {
      const createdRecord = await prisma.vehiclePlate.create({
        data: {
          ...validated.data,
          createdBy: adminUser.id,
        },
        select: {
          id: true,
          plateNumber: true,
          vehicleType: true,
          teamName: true,
          status: true,
          remark: true,
        },
      })

      await createOperationLog({
        actor: adminUser,
        action: OperationAction.CREATE,
        module: OperationModule.VEHICLE_MANAGEMENT,
        businessId: createdRecord.id,
        summary: buildSnapshotSummary([
          { label: "车牌号", value: createdRecord.plateNumber },
          { label: "车辆类型", value: createdRecord.vehicleType },
          { label: "车队名称", value: createdRecord.teamName },
          { label: "状态", value: getRecordStatusLabel(createdRecord.status) },
          { label: "备注", value: createdRecord.remark },
        ]),
      })
    }
  } catch (error) {
    const targets = getUniqueErrorTarget(error)

    if (targets.some((target) => target.includes("plateNumber"))) {
      return createErrorState(
        { plateNumber: ["车牌号已存在。"] },
        "保存失败，请检查车牌号是否重复。"
      )
    }

    throw error
  }

  const pathname = "/dashboard/vehicles"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: id ? "updated" : "created" }))
}

export async function saveDriver(
  _prevState: MasterDataFormState,
  formData: FormData
): Promise<MasterDataFormState> {
  const adminUser = await getAdminUser()
  const id = getOptionalTextValue(formData, "id")
  const validated = driverSchema.safeParse({
    name: getTextValue(formData, "name"),
    phone: getTextValue(formData, "phone"),
    defaultVehicleId: getOptionalTextValue(formData, "defaultVehicleId"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  if (validated.data.defaultVehicleId) {
    const vehicle = await prisma.vehiclePlate.findUnique({
      where: { id: validated.data.defaultVehicleId },
      select: { id: true },
    })

    if (!vehicle) {
      return createErrorState(
        { defaultVehicleId: ["所选默认车牌不存在，请重新选择。"] },
        "保存失败，请检查默认车牌。"
      )
    }
  }

  const data = {
    name: validated.data.name,
    phone: validated.data.phone,
    defaultVehicleId: validated.data.defaultVehicleId ?? null,
    status: validated.data.status,
    remark: validated.data.remark,
  }

  if (id) {
    const beforeRecord = await getDriverForLog(id)
    const updatedRecord = await prisma.driver.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        remark: true,
        defaultVehicle: {
          select: {
            plateNumber: true,
          },
        },
      },
    })

    await createOperationLog({
      actor: adminUser,
      action: OperationAction.UPDATE,
      module: OperationModule.DRIVER_MANAGEMENT,
      businessId: updatedRecord.id,
      summary: buildChangeSummary([
        { label: "司机姓名", before: beforeRecord?.name, after: updatedRecord.name },
        { label: "手机号", before: beforeRecord?.phone, after: updatedRecord.phone },
        { label: "默认车牌", before: beforeRecord?.defaultVehicle?.plateNumber, after: updatedRecord.defaultVehicle?.plateNumber },
        { label: "状态", before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined, after: getRecordStatusLabel(updatedRecord.status) },
        { label: "备注", before: beforeRecord?.remark, after: updatedRecord.remark },
      ]),
    })
  } else {
    const createdRecord = await prisma.driver.create({
      data: {
        ...data,
        createdBy: adminUser.id,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        remark: true,
        defaultVehicle: {
          select: {
            plateNumber: true,
          },
        },
      },
    })

    await createOperationLog({
      actor: adminUser,
      action: OperationAction.CREATE,
      module: OperationModule.DRIVER_MANAGEMENT,
      businessId: createdRecord.id,
      summary: buildSnapshotSummary([
        { label: "司机姓名", value: createdRecord.name },
        { label: "手机号", value: createdRecord.phone },
        { label: "默认车牌", value: createdRecord.defaultVehicle?.plateNumber },
        { label: "状态", value: getRecordStatusLabel(createdRecord.status) },
        { label: "备注", value: createdRecord.remark },
      ]),
    })
  }

  const pathname = "/dashboard/drivers"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: id ? "updated" : "created" }))
}

export async function saveDropLocation(
  _prevState: MasterDataFormState,
  formData: FormData
): Promise<MasterDataFormState> {
  const adminUser = await getAdminUser()
  const id = getOptionalTextValue(formData, "id")
  const validated = dropLocationSchema.safeParse({
    name: getTextValue(formData, "name"),
    province: getTextValue(formData, "province"),
    city: getTextValue(formData, "city"),
    district: getTextValue(formData, "district"),
    detailAddress: getTextValue(formData, "detailAddress"),
    contactName: getOptionalTextValue(formData, "contactName"),
    contactPhone: getOptionalTextValue(formData, "contactPhone"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  const data = {
    ...validated.data,
    fullAddress: buildFullAddress(
      validated.data.province,
      validated.data.city,
      validated.data.district,
      validated.data.detailAddress
    ),
  }

  if (id) {
    const beforeRecord = await getDropLocationForLog(id)
    const updatedRecord = await prisma.dropLocation.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        fullAddress: true,
        contactName: true,
        contactPhone: true,
        status: true,
        remark: true,
      },
    })

    await createOperationLog({
      actor: adminUser,
      action: OperationAction.UPDATE,
      module: OperationModule.DROP_LOCATION_MANAGEMENT,
      businessId: updatedRecord.id,
      summary: buildChangeSummary([
        { label: "地点名称", before: beforeRecord?.name, after: updatedRecord.name },
        { label: "完整地址", before: beforeRecord?.fullAddress, after: updatedRecord.fullAddress },
        { label: "联系人", before: beforeRecord?.contactName, after: updatedRecord.contactName },
        { label: "联系人手机号", before: beforeRecord?.contactPhone, after: updatedRecord.contactPhone },
        { label: "状态", before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined, after: getRecordStatusLabel(updatedRecord.status) },
        { label: "备注", before: beforeRecord?.remark, after: updatedRecord.remark },
      ]),
    })
  } else {
    const createdRecord = await prisma.dropLocation.create({
      data: {
        ...data,
        createdBy: adminUser.id,
      },
      select: {
        id: true,
        name: true,
        fullAddress: true,
        contactName: true,
        contactPhone: true,
        status: true,
        remark: true,
      },
    })

    await createOperationLog({
      actor: adminUser,
      action: OperationAction.CREATE,
      module: OperationModule.DROP_LOCATION_MANAGEMENT,
      businessId: createdRecord.id,
      summary: buildSnapshotSummary([
        { label: "地点名称", value: createdRecord.name },
        { label: "完整地址", value: createdRecord.fullAddress },
        { label: "联系人", value: createdRecord.contactName },
        { label: "联系人手机号", value: createdRecord.contactPhone },
        { label: "状态", value: getRecordStatusLabel(createdRecord.status) },
        { label: "备注", value: createdRecord.remark },
      ]),
    })
  }

  const pathname = "/dashboard/drop-locations"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: id ? "updated" : "created" }))
}

export async function toggleContainerTypeStatus(id: string, nextStatus: RecordStatus) {
  const adminUser = await requireAdminAccess()
  const beforeRecord = await getContainerTypeForLog(id)

  const updatedRecord = await prisma.containerType.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      remark: true,
    },
  })

  await createOperationLog({
    actor: adminUser,
    action: OperationAction.UPDATE,
    module: OperationModule.CONTAINER_TYPE_MANAGEMENT,
    businessId: updatedRecord.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
        after: getRecordStatusLabel(updatedRecord.status),
      },
    ]),
  })

  const pathname = "/dashboard/container-types"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "status-updated" }))
}

export async function toggleCompanyStatus(id: string, nextStatus: RecordStatus) {
  const adminUser = await requireAdminAccess()
  const beforeRecord = await getCompanyForLog(id)

  const updatedRecord = await prisma.company.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      name: true,
      socialCreditCode: true,
      contactName: true,
      contactPhone: true,
      status: true,
      remark: true,
    },
  })

  await createOperationLog({
    actor: adminUser,
    action: OperationAction.UPDATE,
    module: OperationModule.COMPANY_MANAGEMENT,
    businessId: updatedRecord.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
        after: getRecordStatusLabel(updatedRecord.status),
      },
    ]),
  })

  const pathname = "/dashboard/companies"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "status-updated" }))
}

export async function toggleVehiclePlateStatus(id: string, nextStatus: RecordStatus) {
  const adminUser = await requireAdminAccess()
  const beforeRecord = await getVehicleForLog(id)

  const updatedRecord = await prisma.vehiclePlate.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      plateNumber: true,
      vehicleType: true,
      teamName: true,
      status: true,
      remark: true,
    },
  })

  await createOperationLog({
    actor: adminUser,
    action: OperationAction.UPDATE,
    module: OperationModule.VEHICLE_MANAGEMENT,
    businessId: updatedRecord.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
        after: getRecordStatusLabel(updatedRecord.status),
      },
    ]),
  })

  const pathname = "/dashboard/vehicles"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "status-updated" }))
}

export async function toggleDriverStatus(id: string, nextStatus: RecordStatus) {
  const adminUser = await requireAdminAccess()
  const beforeRecord = await getDriverForLog(id)

  const updatedRecord = await prisma.driver.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      remark: true,
      defaultVehicle: {
        select: {
          plateNumber: true,
        },
      },
    },
  })

  await createOperationLog({
    actor: adminUser,
    action: OperationAction.UPDATE,
    module: OperationModule.DRIVER_MANAGEMENT,
    businessId: updatedRecord.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
        after: getRecordStatusLabel(updatedRecord.status),
      },
    ]),
  })

  const pathname = "/dashboard/drivers"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "status-updated" }))
}

export async function toggleDropLocationStatus(id: string, nextStatus: RecordStatus) {
  const adminUser = await requireAdminAccess()
  const beforeRecord = await getDropLocationForLog(id)

  const updatedRecord = await prisma.dropLocation.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      name: true,
      fullAddress: true,
      contactName: true,
      contactPhone: true,
      status: true,
      remark: true,
    },
  })

  await createOperationLog({
    actor: adminUser,
    action: OperationAction.UPDATE,
    module: OperationModule.DROP_LOCATION_MANAGEMENT,
    businessId: updatedRecord.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: beforeRecord ? getRecordStatusLabel(beforeRecord.status) : undefined,
        after: getRecordStatusLabel(updatedRecord.status),
      },
    ]),
  })

  const pathname = "/dashboard/drop-locations"
  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "status-updated" }))
}

export async function deleteContainerType(id: string) {
  const adminUser = await requireAdminAccess()
  const targetRecord = await getContainerTypeForLog(id)
  const loadCount = await prisma.load.count({
    where: { containerTypeId: id },
  })

  const pathname = "/dashboard/container-types"
  if (loadCount > 0) {
    redirect(buildListPath(pathname, { notice: "in-use" }))
  }

  await prisma.containerType.delete({
    where: { id },
  })

  if (targetRecord) {
    await createOperationLog({
      actor: adminUser,
      action: OperationAction.DELETE,
      module: OperationModule.CONTAINER_TYPE_MANAGEMENT,
      businessId: targetRecord.id,
      summary: buildSnapshotSummary([
        { label: "箱型名称", value: targetRecord.name },
        { label: "箱型编码", value: targetRecord.code },
        { label: "状态", value: getRecordStatusLabel(targetRecord.status) },
        { label: "备注", value: targetRecord.remark },
      ]),
    })
  }

  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "deleted" }))
}

export async function deleteCompany(id: string) {
  const adminUser = await requireAdminAccess()
  const targetRecord = await getCompanyForLog(id)
  const loadCount = await prisma.load.count({
    where: { companyId: id },
  })

  const pathname = "/dashboard/companies"
  if (loadCount > 0) {
    redirect(buildListPath(pathname, { notice: "in-use" }))
  }

  await prisma.company.delete({
    where: { id },
  })

  if (targetRecord) {
    await createOperationLog({
      actor: adminUser,
      action: OperationAction.DELETE,
      module: OperationModule.COMPANY_MANAGEMENT,
      businessId: targetRecord.id,
      summary: buildSnapshotSummary([
        { label: "公司名称", value: targetRecord.name },
        { label: "统一社会信用代码", value: targetRecord.socialCreditCode },
        { label: "联系人", value: targetRecord.contactName },
        { label: "联系电话", value: targetRecord.contactPhone },
        { label: "状态", value: getRecordStatusLabel(targetRecord.status) },
        { label: "备注", value: targetRecord.remark },
      ]),
    })
  }

  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "deleted" }))
}

export async function deleteVehiclePlate(id: string) {
  const adminUser = await requireAdminAccess()
  const targetRecord = await getVehicleForLog(id)
  const loadCount = await prisma.load.count({
    where: { vehicleId: id },
  })

  const pathname = "/dashboard/vehicles"
  if (loadCount > 0) {
    redirect(buildListPath(pathname, { notice: "in-use" }))
  }

  await prisma.vehiclePlate.delete({
    where: { id },
  })

  if (targetRecord) {
    await createOperationLog({
      actor: adminUser,
      action: OperationAction.DELETE,
      module: OperationModule.VEHICLE_MANAGEMENT,
      businessId: targetRecord.id,
      summary: buildSnapshotSummary([
        { label: "车牌号", value: targetRecord.plateNumber },
        { label: "车辆类型", value: targetRecord.vehicleType },
        { label: "车队名称", value: targetRecord.teamName },
        { label: "状态", value: getRecordStatusLabel(targetRecord.status) },
        { label: "备注", value: targetRecord.remark },
      ]),
    })
  }

  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "deleted" }))
}

export async function deleteDriver(id: string) {
  const adminUser = await requireAdminAccess()
  const targetRecord = await getDriverForLog(id)

  const [loadCount, boundUserCount] = await Promise.all([
    prisma.load.count({
      where: { driverId: id },
    }),
    prisma.user.count({
      where: { driverProfileId: id },
    }),
  ])

  const pathname = "/dashboard/drivers"
  if (loadCount > 0 || boundUserCount > 0) {
    redirect(buildListPath(pathname, { notice: "in-use" }))
  }

  await prisma.driver.delete({
    where: { id },
  })

  if (targetRecord) {
    await createOperationLog({
      actor: adminUser,
      action: OperationAction.DELETE,
      module: OperationModule.DRIVER_MANAGEMENT,
      businessId: targetRecord.id,
      summary: buildSnapshotSummary([
        { label: "司机姓名", value: targetRecord.name },
        { label: "手机号", value: targetRecord.phone },
        { label: "默认车牌", value: targetRecord.defaultVehicle?.plateNumber },
        { label: "状态", value: getRecordStatusLabel(targetRecord.status) },
        { label: "备注", value: targetRecord.remark },
      ]),
    })
  }

  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "deleted" }))
}

export async function deleteDropLocation(id: string) {
  const adminUser = await requireAdminAccess()
  const targetRecord = await getDropLocationForLog(id)
  const loadCount = await prisma.load.count({
    where: { dropLocationId: id },
  })

  const pathname = "/dashboard/drop-locations"
  if (loadCount > 0) {
    redirect(buildListPath(pathname, { notice: "in-use" }))
  }

  await prisma.dropLocation.delete({
    where: { id },
  })

  if (targetRecord) {
    await createOperationLog({
      actor: adminUser,
      action: OperationAction.DELETE,
      module: OperationModule.DROP_LOCATION_MANAGEMENT,
      businessId: targetRecord.id,
      summary: buildSnapshotSummary([
        { label: "地点名称", value: targetRecord.name },
        { label: "完整地址", value: targetRecord.fullAddress },
        { label: "联系人", value: targetRecord.contactName },
        { label: "联系人手机号", value: targetRecord.contactPhone },
        { label: "状态", value: getRecordStatusLabel(targetRecord.status) },
        { label: "备注", value: targetRecord.remark },
      ]),
    })
  }

  revalidateMasterDataPath(pathname)
  redirect(buildListPath(pathname, { notice: "deleted" }))
}
