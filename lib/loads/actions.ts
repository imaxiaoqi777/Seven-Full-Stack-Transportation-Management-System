"use server"

import { LoadStatus, Prisma, RecordStatus, Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireModuleAccess } from "@/lib/auth-service"
import { prisma } from "@/lib/db"
import { buildFullAddress, buildListPath, emptyToUndefined } from "@/lib/master-data/utils"
import {
  OperationAction,
  OperationModule,
  buildChangeSummary,
  buildSnapshotSummary,
  createOperationLog,
} from "@/lib/operation-logs/service"

import { loadSchema } from "./schemas"
import type { LoadFormState } from "./types"
import {
  appendNoticeToPath,
  buildLoadNumber,
  formatLoadAmount,
  formatLoadDateTimeLabel,
  getLoadStatusLabel,
} from "./utils"

const FORM_ERROR_MESSAGE = "请先修正表单错误后再提交。"
const LOAD_LIST_PATH = "/dashboard/loads"

const loadLogSelect = {
  id: true,
  loadNumber: true,
  pickupAt: true,
  destination: true,
  blNumber: true,
  vesselVoyage: true,
  containerNumber: true,
  sealNumber: true,
  status: true,
  company: {
    select: {
      name: true,
      socialCreditCode: true,
    },
  },
  containerType: {
    select: {
      name: true,
    },
  },
  dropLocation: {
    select: {
      name: true,
    },
  },
  vehicle: {
    select: {
      plateNumber: true,
    },
  },
  driver: {
    select: {
      name: true,
    },
  },
  operatorUser: {
    select: {
      username: true,
    },
  },
  totalFee: true,
  gasFee: true,
  driverPay: true,
  otherFee: true,
  otherFeeRemark: true,
  balanceFee: true,
} satisfies Prisma.LoadSelect

type ValidateLoadRelationsInput = {
  companyId: string
  containerTypeId: string
  dropLocationId: string
  vehicleId: string
  driverId: string
  operatorUserId: string
}

function createErrorState(
  errors: Record<string, string[] | undefined>,
  message = FORM_ERROR_MESSAGE
): LoadFormState {
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

function calculateBalanceFee(totalFee: number, gasFee: number, driverPay: number, otherFee: number) {
  return Number((totalFee - gasFee - driverPay - otherFee).toFixed(2))
}

function formatLoadLogDateTime(value: Date | string | null | undefined) {
  return formatLoadDateTimeLabel(value, "未填写")
}

function revalidateLoadPaths(id?: string) {
  revalidatePath(LOAD_LIST_PATH)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/loads/new")
  revalidatePath("/dashboard/operation-logs")

  if (id) {
    revalidatePath(`/dashboard/loads/${id}/edit`)
  }
}

async function findEditableLoad(id: string, currentUserId: string, currentUserRole: Role) {
  return prisma.load.findFirst({
    where: {
      id,
      ...(currentUserRole === Role.ADMIN ? {} : { operatorUserId: currentUserId }),
    },
    select: {
      id: true,
      loadNumber: true,
    },
  })
}

async function getLoadForLog(id: string, currentUserId: string, currentUserRole: Role) {
  return prisma.load.findFirst({
    where: {
      id,
      ...(currentUserRole === Role.ADMIN ? {} : { operatorUserId: currentUserId }),
    },
    select: loadLogSelect,
  })
}

async function createHistory(loadId: string, changedBy: string, action: string, description: string) {
  await prisma.loadHistory.create({
    data: {
      loadId,
      changedBy,
      action,
      description,
    },
  })
}

async function validateLoadRelations(
  data: ValidateLoadRelationsInput,
  currentUser: {
    id: string
    role: Role
  }
) {
  const [company, containerType, dropLocation, vehicle, driver, operatorUser, currentDbUser] =
    await Promise.all([
      prisma.company.findUnique({ where: { id: data.companyId }, select: { id: true } }),
      prisma.containerType.findUnique({
        where: { id: data.containerTypeId },
        select: { id: true },
      }),
      prisma.dropLocation.findUnique({
        where: { id: data.dropLocationId },
        select: { id: true },
      }),
      prisma.vehiclePlate.findUnique({
        where: { id: data.vehicleId },
        select: { id: true },
      }),
      prisma.driver.findUnique({
        where: { id: data.driverId },
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: data.operatorUserId },
        select: {
          id: true,
          role: true,
          status: true,
          driverProfileId: true,
          driverProfile: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      currentUser.role === Role.DRIVER
        ? prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
              id: true,
              driverProfileId: true,
              driverProfile: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ])

  const errors: Record<string, string[] | undefined> = {}

  if (!company) {
    errors.companyId = ["所选公司不存在，请重新选择。"]
  }

  if (!containerType) {
    errors.containerTypeId = ["所选箱型不存在，请重新选择。"]
  }

  if (!dropLocation) {
    errors.dropLocationId = ["所选落箱地点不存在，请重新选择。"]
  }

  if (!vehicle) {
    errors.vehicleId = ["所选车牌号不存在，请重新选择。"]
  }

  if (!driver) {
    errors.driverId = ["所选司机不存在，请重新选择。"]
  }

  if (!operatorUser) {
    errors.operatorUserId = ["所选操作人员不存在，请重新选择。"]
    return { errors, resolvedDriverId: null as string | null }
  }

  const isAdminSelfOperator =
    currentUser.role === Role.ADMIN && data.operatorUserId === currentUser.id

  if (isAdminSelfOperator) {
    if (operatorUser.status !== RecordStatus.ENABLED) {
      errors.operatorUserId = ["当前管理员账号已禁用，无法继续保存运单。"]
    }

    if (driver && driver.status !== RecordStatus.ENABLED) {
      errors.driverId = ["所选司机资料已禁用，不能用于运单。"]
    }

    return {
      errors,
      resolvedDriverId: driver?.id ?? null,
    }
  }

  if (operatorUser.role !== Role.DRIVER) {
    errors.operatorUserId = ["操作人员必须是司机账号。"]
  }

  if (operatorUser.status !== RecordStatus.ENABLED) {
    errors.operatorUserId = ["操作人员账号已禁用，请重新选择。"]
  }

  if (!operatorUser.driverProfileId || !operatorUser.driverProfile) {
    errors.operatorUserId = ["该司机账号尚未绑定司机管理中的司机资料。"]
    return { errors, resolvedDriverId: null as string | null }
  }

  if (operatorUser.driverProfile.status !== RecordStatus.ENABLED) {
    errors.driverId = ["该司机资料已禁用，不能用于运单。"]
  }

  if (data.driverId !== operatorUser.driverProfileId) {
    errors.driverId = ["司机名称必须与操作人员绑定的司机资料一致。"]
  }

  if (currentUser.role === Role.DRIVER) {
    if (!currentDbUser?.driverProfileId || !currentDbUser.driverProfile) {
      errors.operatorUserId = ["当前司机账号尚未绑定司机资料，暂时不能保存运单。"]
    } else {
      if (data.operatorUserId !== currentUser.id) {
        errors.operatorUserId = ["司机账号只能查看和操作自己的运单。"]
      }

      if (currentDbUser.driverProfileId !== operatorUser.driverProfileId) {
        errors.driverId = ["司机名称和操作人员必须是当前账号绑定的司机资料。"]
      }
    }
  }

  return {
    errors,
    resolvedDriverId: operatorUser.driverProfileId,
  }
}

export async function saveLoad(
  _prevState: LoadFormState,
  formData: FormData
): Promise<LoadFormState> {
  const currentUser = await requireModuleAccess("loads")
  const id = getOptionalTextValue(formData, "id")

  const validated = loadSchema.safeParse({
    pickupAt: getTextValue(formData, "pickupAt"),
    destinationProvince: getTextValue(formData, "destinationProvince"),
    destinationCity: getTextValue(formData, "destinationCity"),
    destinationDistrict: getTextValue(formData, "destinationDistrict"),
    destinationDetailAddress: getTextValue(formData, "destinationDetailAddress"),
    companyId: getTextValue(formData, "companyId"),
    containerTypeId: getTextValue(formData, "containerTypeId"),
    blNumber: getTextValue(formData, "blNumber"),
    vesselVoyage: getOptionalTextValue(formData, "vesselVoyage"),
    containerNumber: getTextValue(formData, "containerNumber"),
    sealNumber: getOptionalTextValue(formData, "sealNumber"),
    dropLocationId: getTextValue(formData, "dropLocationId"),
    vehicleId: getTextValue(formData, "vehicleId"),
    driverId: getTextValue(formData, "driverId"),
    operatorUserId: getTextValue(formData, "operatorUserId"),
    totalFee: getTextValue(formData, "totalFee"),
    gasFee: getTextValue(formData, "gasFee"),
    driverPay: getTextValue(formData, "driverPay"),
    otherFee: getTextValue(formData, "otherFee"),
    otherFeeRemark: getOptionalTextValue(formData, "otherFeeRemark"),
    status: getTextValue(formData, "status"),
    remark: getOptionalTextValue(formData, "remark"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  let beforeLoad: Awaited<ReturnType<typeof getLoadForLog>> | null = null

  if (id) {
    const existingLoad = await findEditableLoad(id, currentUser.id, currentUser.role)

    if (!existingLoad) {
      return createErrorState({}, "未找到该运单，或当前账号没有修改权限。")
    }

    beforeLoad = await getLoadForLog(id, currentUser.id, currentUser.role)
  }

  const relationResult = await validateLoadRelations(validated.data, {
    id: currentUser.id,
    role: currentUser.role,
  })

  if (Object.keys(relationResult.errors).length > 0 || !relationResult.resolvedDriverId) {
    return createErrorState(relationResult.errors, "保存失败，请检查公司、司机与操作人员的绑定关系。")
  }

  const destination = buildFullAddress(
    validated.data.destinationProvince,
    validated.data.destinationCity,
    validated.data.destinationDistrict,
    validated.data.destinationDetailAddress
  )
  const totalFee = validated.data.totalFee ?? 0
  const gasFee = validated.data.gasFee ?? 0
  const driverPay = validated.data.driverPay ?? 0
  const otherFee = validated.data.otherFee ?? 0
  const balanceFee = calculateBalanceFee(totalFee, gasFee, driverPay, otherFee)

  const data = {
    pickupAt: validated.data.pickupAt,
    destination,
    companyId: validated.data.companyId,
    containerTypeId: validated.data.containerTypeId,
    blNumber: validated.data.blNumber,
    vesselVoyage: validated.data.vesselVoyage,
    containerNumber: validated.data.containerNumber,
    sealNumber: validated.data.sealNumber,
    dropLocationId: validated.data.dropLocationId,
    vehicleId: validated.data.vehicleId,
    driverId: relationResult.resolvedDriverId,
    operatorUserId: validated.data.operatorUserId,
    totalFee,
    gasFee,
    driverPay,
    otherFee,
    otherFeeRemark: otherFee > 0 ? validated.data.otherFeeRemark ?? null : null,
    balanceFee,
    status: validated.data.status,
    remark: validated.data.remark,
  }

  if (id) {
    const updated = await prisma.load.update({
      where: { id },
      data,
      select: loadLogSelect,
    })

    await createHistory(updated.id, currentUser.id, "updated", `更新运单 ${updated.loadNumber}。`)
    await createOperationLog({
      actor: currentUser,
      action: OperationAction.UPDATE,
      module: OperationModule.LOAD_MANAGEMENT,
      businessId: updated.id,
      summary: buildChangeSummary([
        {
          label: "提箱时间",
          before: beforeLoad ? formatLoadLogDateTime(beforeLoad.pickupAt) : undefined,
          after: formatLoadLogDateTime(updated.pickupAt),
        },
        { label: "目的地", before: beforeLoad?.destination, after: updated.destination },
        { label: "所属公司", before: beforeLoad?.company?.name, after: updated.company?.name },
        {
          label: "公司信用代码",
          before: beforeLoad?.company?.socialCreditCode,
          after: updated.company?.socialCreditCode,
        },
        { label: "箱型", before: beforeLoad?.containerType.name, after: updated.containerType.name },
        { label: "提单号", before: beforeLoad?.blNumber, after: updated.blNumber },
        { label: "船名航次", before: beforeLoad?.vesselVoyage, after: updated.vesselVoyage },
        { label: "箱号", before: beforeLoad?.containerNumber, after: updated.containerNumber },
        { label: "封号", before: beforeLoad?.sealNumber, after: updated.sealNumber },
        { label: "落箱地点", before: beforeLoad?.dropLocation.name, after: updated.dropLocation.name },
        { label: "车牌号", before: beforeLoad?.vehicle.plateNumber, after: updated.vehicle.plateNumber },
        { label: "司机", before: beforeLoad?.driver.name, after: updated.driver.name },
        { label: "操作人员", before: beforeLoad?.operatorUser.username, after: updated.operatorUser.username },
        {
          label: "总费用",
          before: beforeLoad ? formatLoadAmount(beforeLoad.totalFee) : undefined,
          after: formatLoadAmount(updated.totalFee),
        },
        {
          label: "燃气费",
          before: beforeLoad ? formatLoadAmount(beforeLoad.gasFee) : undefined,
          after: formatLoadAmount(updated.gasFee),
        },
        {
          label: "司机工资",
          before: beforeLoad ? formatLoadAmount(beforeLoad.driverPay) : undefined,
          after: formatLoadAmount(updated.driverPay),
        },
        {
          label: "其他费用",
          before: beforeLoad ? formatLoadAmount(beforeLoad.otherFee) : undefined,
          after: formatLoadAmount(updated.otherFee),
        },
        {
          label: "其他费用说明",
          before: beforeLoad?.otherFeeRemark,
          after: updated.otherFeeRemark,
        },
        {
          label: "结余",
          before: beforeLoad ? formatLoadAmount(beforeLoad.balanceFee) : undefined,
          after: formatLoadAmount(updated.balanceFee),
        },
        {
          label: "状态",
          before: beforeLoad ? getLoadStatusLabel(beforeLoad.status) : undefined,
          after: getLoadStatusLabel(updated.status),
        },
      ]),
    })

    revalidateLoadPaths(updated.id)
    redirect(buildListPath(LOAD_LIST_PATH, { notice: "updated" }))
  }

  let createdLoad: { id: string; loadNumber: string } | null = null
  let attempts = 0

  while (!createdLoad && attempts < 3) {
    attempts += 1
    const loadNumber = buildLoadNumber()

    try {
      createdLoad = await prisma.load.create({
        data: {
          loadNumber,
          ...data,
          createdBy: currentUser.id,
        },
        select: {
          id: true,
          loadNumber: true,
        },
      })
    } catch (error) {
      const targets = getUniqueErrorTarget(error)

      if (!targets.some((target) => target.includes("loadNumber"))) {
        throw error
      }
    }
  }

  if (!createdLoad) {
    return createErrorState({}, "系统生成运单号失败，请稍后重试。")
  }

  const createdLoadForLog = await getLoadForLog(createdLoad.id, currentUser.id, currentUser.role)

  await createHistory(createdLoad.id, currentUser.id, "created", `创建运单 ${createdLoad.loadNumber}。`)

  if (createdLoadForLog) {
    await createOperationLog({
      actor: currentUser,
      action: OperationAction.CREATE,
      module: OperationModule.LOAD_MANAGEMENT,
      businessId: createdLoadForLog.id,
      summary: buildSnapshotSummary([
        { label: "提箱时间", value: formatLoadLogDateTime(createdLoadForLog.pickupAt) },
        { label: "运单号", value: createdLoadForLog.loadNumber },
        { label: "目的地", value: createdLoadForLog.destination },
        { label: "所属公司", value: createdLoadForLog.company?.name },
        { label: "公司信用代码", value: createdLoadForLog.company?.socialCreditCode },
        { label: "箱型", value: createdLoadForLog.containerType.name },
        { label: "提单号", value: createdLoadForLog.blNumber },
        { label: "箱号", value: createdLoadForLog.containerNumber },
        { label: "落箱地点", value: createdLoadForLog.dropLocation.name },
        { label: "车牌号", value: createdLoadForLog.vehicle.plateNumber },
        { label: "司机", value: createdLoadForLog.driver.name },
        { label: "操作人员", value: createdLoadForLog.operatorUser.username },
        { label: "总费用", value: formatLoadAmount(createdLoadForLog.totalFee) },
        { label: "燃气费", value: formatLoadAmount(createdLoadForLog.gasFee) },
        { label: "司机工资", value: formatLoadAmount(createdLoadForLog.driverPay) },
        { label: "其他费用", value: formatLoadAmount(createdLoadForLog.otherFee) },
        { label: "其他费用说明", value: createdLoadForLog.otherFeeRemark },
        { label: "结余", value: formatLoadAmount(createdLoadForLog.balanceFee) },
        { label: "状态", value: getLoadStatusLabel(createdLoadForLog.status) },
      ]),
    })
  }

  revalidateLoadPaths(createdLoad.id)
  redirect(buildListPath(LOAD_LIST_PATH, { notice: "created" }))
}

export async function updateLoadStatus(id: string, returnPath: string, formData: FormData) {
  const currentUser = await requireModuleAccess("loads")
  const targetLoad = await getLoadForLog(id, currentUser.id, currentUser.role)

  if (!targetLoad) {
    redirect(returnPath)
  }

  const rawStatus = getTextValue(formData, "status")

  if (!Object.values(LoadStatus).includes(rawStatus as LoadStatus)) {
    redirect(returnPath)
  }

  const nextStatus = rawStatus as LoadStatus

  if (targetLoad.status === nextStatus) {
    redirect(returnPath)
  }

  const updatedLoad = await prisma.load.update({
    where: { id: targetLoad.id },
    data: { status: nextStatus },
    select: loadLogSelect,
  })

  await createHistory(
    updatedLoad.id,
    currentUser.id,
    "status-updated",
    `更新运单 ${updatedLoad.loadNumber} 状态为 ${getLoadStatusLabel(updatedLoad.status)}。`
  )
  await createOperationLog({
    actor: currentUser,
    action: OperationAction.UPDATE,
    module: OperationModule.LOAD_MANAGEMENT,
    businessId: updatedLoad.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: getLoadStatusLabel(targetLoad.status),
        after: getLoadStatusLabel(updatedLoad.status),
      },
    ]),
  })

  revalidateLoadPaths(updatedLoad.id)
  redirect(appendNoticeToPath(returnPath, "status-updated"))
}

export async function deleteLoad(id: string, returnPath: string) {
  const currentUser = await requireModuleAccess("loads")
  const targetLoad = await getLoadForLog(id, currentUser.id, currentUser.role)

  if (!targetLoad) {
    redirect(returnPath)
  }

  await prisma.load.delete({
    where: { id: targetLoad.id },
  })

  await createOperationLog({
    actor: currentUser,
    action: OperationAction.DELETE,
    module: OperationModule.LOAD_MANAGEMENT,
    businessId: targetLoad.id,
    summary: buildSnapshotSummary([
      { label: "提箱时间", value: formatLoadLogDateTime(targetLoad.pickupAt) },
      { label: "运单号", value: targetLoad.loadNumber },
      { label: "目的地", value: targetLoad.destination },
      { label: "所属公司", value: targetLoad.company?.name },
      { label: "公司信用代码", value: targetLoad.company?.socialCreditCode },
      { label: "箱型", value: targetLoad.containerType.name },
      { label: "提单号", value: targetLoad.blNumber },
      { label: "船名航次", value: targetLoad.vesselVoyage },
      { label: "箱号", value: targetLoad.containerNumber },
      { label: "封号", value: targetLoad.sealNumber },
      { label: "落箱地点", value: targetLoad.dropLocation.name },
      { label: "车牌号", value: targetLoad.vehicle.plateNumber },
      { label: "司机", value: targetLoad.driver.name },
      { label: "操作人员", value: targetLoad.operatorUser.username },
      { label: "总费用", value: formatLoadAmount(targetLoad.totalFee) },
      { label: "燃气费", value: formatLoadAmount(targetLoad.gasFee) },
      { label: "司机工资", value: formatLoadAmount(targetLoad.driverPay) },
      { label: "其他费用", value: formatLoadAmount(targetLoad.otherFee) },
      { label: "其他费用说明", value: targetLoad.otherFeeRemark },
      { label: "结余", value: formatLoadAmount(targetLoad.balanceFee) },
      { label: "状态", value: getLoadStatusLabel(targetLoad.status) },
    ]),
  })

  revalidateLoadPaths(targetLoad.id)
  redirect(appendNoticeToPath(returnPath, "deleted"))
}
