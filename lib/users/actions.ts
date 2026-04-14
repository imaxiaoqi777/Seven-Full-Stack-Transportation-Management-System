"use server"

import { Prisma, RecordStatus, Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { hashPassword } from "@/lib/auth"
import { requireAdminAccess } from "@/lib/auth-service"
import { prisma } from "@/lib/db"
import { buildListPath } from "@/lib/master-data/utils"
import {
  OperationAction,
  OperationModule,
  buildChangeSummary,
  buildSnapshotSummary,
  createOperationLog,
} from "@/lib/operation-logs/service"

import { createUserSchema, resetPasswordSchema, updateUserSchema } from "./schemas"
import type { UserFormState } from "./types"
import { getUserRoleLabel, getUserStatusLabel } from "./utils"

const FORM_ERROR_MESSAGE = "请先修正表单错误后再提交。"
const USER_LIST_PATH = "/dashboard/users"

function createErrorState(
  errors: Record<string, string[] | undefined>,
  message = FORM_ERROR_MESSAGE
): UserFormState {
  return {
    errors,
    message,
  }
}

function getTextValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? ""
}

function getOptionalTextValue(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim() ?? ""
  return value || undefined
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

function revalidateUserPaths() {
  revalidatePath(USER_LIST_PATH)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/loads")
  revalidatePath("/dashboard/loads/new")
  revalidatePath("/dashboard/operation-logs")
  revalidatePath("/login")
}

function getBoundDriverLabel(user: {
  driverProfile?: { name: string } | null
  driverProfileId?: string | null
}) {
  return user.driverProfileId && user.driverProfile ? user.driverProfile.name : "未绑定"
}

async function countEnabledAdmins(excludeId?: string) {
  return prisma.user.count({
    where: {
      role: Role.ADMIN,
      status: RecordStatus.ENABLED,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })
}

async function getUserSummary(id: string) {
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
          name: true,
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
  })
}

async function getUserForLog(id: string) {
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
          name: true,
        },
      },
    },
  })
}

function getUsageCount(user: NonNullable<Awaited<ReturnType<typeof getUserSummary>>>) {
  return (
    user._count.containerTypes +
    user._count.vehiclePlates +
    user._count.drivers +
    user._count.dropLocations +
    user._count.createdLoads +
    user._count.operatedLoads +
    user._count.loadHistory
  )
}

async function getStateProtectionNotice(
  targetId: string,
  currentUserId: string,
  nextRole: Role,
  nextStatus: RecordStatus
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  })

  if (!targetUser) {
    return "updated"
  }

  if (targetUser.id === currentUserId) {
    if (nextStatus === RecordStatus.DISABLED) {
      return "self-status-blocked"
    }

    if (nextRole !== Role.ADMIN) {
      return "self-role-blocked"
    }
  }

  const removesEnabledAdmin =
    targetUser.role === Role.ADMIN &&
    targetUser.status === RecordStatus.ENABLED &&
    !(nextRole === Role.ADMIN && nextStatus === RecordStatus.ENABLED)

  if (removesEnabledAdmin) {
    const otherEnabledAdminCount = await countEnabledAdmins(targetId)

    if (otherEnabledAdminCount === 0) {
      return "last-admin"
    }
  }

  return null
}

async function validateDriverBinding(driverProfileId: string | undefined, currentUserId?: string) {
  if (!driverProfileId) {
    return null
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverProfileId },
    select: {
      id: true,
      boundUser: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  if (!driver) {
    return createErrorState(
      { driverProfileId: ["所选司机资料不存在，请重新选择。"] },
      "保存失败，请检查司机绑定。"
    )
  }

  if (driver.boundUser && driver.boundUser.id !== currentUserId) {
    return createErrorState(
      { driverProfileId: [`该司机资料已绑定账号“${driver.boundUser.username}”。`] },
      "保存失败，请重新选择未绑定的司机资料。"
    )
  }

  return null
}

export async function saveUser(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const currentUser = await requireAdminAccess()
  const id = getOptionalTextValue(formData, "id")

  if (id) {
    const beforeUser = await getUserForLog(id)
    const validated = updateUserSchema.safeParse({
      username: getTextValue(formData, "username"),
      role: getTextValue(formData, "role"),
      status: getTextValue(formData, "status"),
      driverProfileId: getOptionalTextValue(formData, "driverProfileId"),
    })

    if (!validated.success) {
      return createErrorState(validated.error.flatten().fieldErrors)
    }

    const notice = await getStateProtectionNotice(
      id,
      currentUser.id,
      validated.data.role,
      validated.data.status
    )

    if (notice === "self-status-blocked") {
      return createErrorState({}, "当前登录账号不能被禁用。")
    }

    if (notice === "self-role-blocked") {
      return createErrorState({}, "当前登录账号不能把自己改成司机。")
    }

    if (notice === "last-admin") {
      return createErrorState({}, "系统至少需要保留一个启用中的管理员账号。")
    }

    if (validated.data.role === Role.DRIVER) {
      const bindingState = await validateDriverBinding(validated.data.driverProfileId, id)
      if (bindingState) {
        return bindingState
      }
    }

    let updatedUser: NonNullable<Awaited<ReturnType<typeof getUserForLog>>> | null = null

    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          username: validated.data.username,
          role: validated.data.role,
          status: validated.data.status,
          driverProfileId:
            validated.data.role === Role.DRIVER ? validated.data.driverProfileId ?? null : null,
        },
        select: {
          id: true,
          username: true,
          account: true,
          role: true,
          status: true,
          driverProfileId: true,
          driverProfile: {
            select: {
              name: true,
            },
          },
        },
      })
    } catch (error) {
      const targets = getUniqueErrorTarget(error)
      if (targets.some((target) => target.includes("driverProfileId"))) {
        return createErrorState(
          { driverProfileId: ["该司机资料已绑定其他账号。"] },
          "保存失败，请重新选择未绑定的司机资料。"
        )
      }
      throw error
    }

    await createOperationLog({
      actor: currentUser,
      action: OperationAction.UPDATE,
      module: OperationModule.USER_MANAGEMENT,
      businessId: updatedUser.id,
      summary: buildChangeSummary([
        { label: "用户名", before: beforeUser?.username, after: updatedUser.username },
        { label: "角色", before: beforeUser ? getUserRoleLabel(beforeUser.role) : undefined, after: getUserRoleLabel(updatedUser.role) },
        { label: "状态", before: beforeUser ? getUserStatusLabel(beforeUser.status) : undefined, after: getUserStatusLabel(updatedUser.status) },
        { label: "绑定司机", before: beforeUser ? getBoundDriverLabel(beforeUser) : undefined, after: getBoundDriverLabel(updatedUser) },
      ]),
    })

    revalidateUserPaths()
    redirect(buildListPath(USER_LIST_PATH, { notice: "updated" }))
  }

  const validated = createUserSchema.safeParse({
    username: getTextValue(formData, "username"),
    account: getTextValue(formData, "account"),
    role: getTextValue(formData, "role"),
    status: getTextValue(formData, "status"),
    driverProfileId: getOptionalTextValue(formData, "driverProfileId"),
    password: getTextValue(formData, "password"),
    confirmPassword: getTextValue(formData, "confirmPassword"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  if (validated.data.role === Role.DRIVER) {
    const bindingState = await validateDriverBinding(validated.data.driverProfileId)
    if (bindingState) {
      return bindingState
    }
  }

  const hashedPassword = await hashPassword(validated.data.password)
  let createdUser: NonNullable<Awaited<ReturnType<typeof getUserForLog>>> | null = null

  try {
    createdUser = await prisma.user.create({
      data: {
        username: validated.data.username,
        account: validated.data.account,
        password: hashedPassword,
        role: validated.data.role,
        status: validated.data.status,
        driverProfileId:
          validated.data.role === Role.DRIVER ? validated.data.driverProfileId ?? null : null,
      },
      select: {
        id: true,
        username: true,
        account: true,
        role: true,
        status: true,
        driverProfileId: true,
        driverProfile: {
          select: {
            name: true,
          },
        },
      },
    })
  } catch (error) {
    const targets = getUniqueErrorTarget(error)
    if (targets.some((target) => target.includes("account"))) {
      return createErrorState(
        { account: ["账号已存在。"] },
        "保存失败，请检查账号是否重复。"
      )
    }
    if (targets.some((target) => target.includes("driverProfileId"))) {
      return createErrorState(
        { driverProfileId: ["该司机资料已绑定其他账号。"] },
        "保存失败，请重新选择未绑定的司机资料。"
      )
    }
    throw error
  }

  await createOperationLog({
    actor: currentUser,
    action: OperationAction.CREATE,
    module: OperationModule.USER_MANAGEMENT,
    businessId: createdUser.id,
    summary: buildSnapshotSummary([
      { label: "用户名", value: createdUser.username },
      { label: "账号", value: createdUser.account },
      { label: "角色", value: getUserRoleLabel(createdUser.role) },
      { label: "状态", value: getUserStatusLabel(createdUser.status) },
      { label: "绑定司机", value: getBoundDriverLabel(createdUser) },
    ]),
  })

  revalidateUserPaths()
  redirect(buildListPath(USER_LIST_PATH, { notice: "created" }))
}

export async function toggleUserStatus(id: string, nextStatus: RecordStatus) {
  const currentUser = await requireAdminAccess()
  const targetUser = await getUserForLog(id)

  if (!targetUser) {
    redirect(buildListPath(USER_LIST_PATH, { notice: "updated" }))
  }

  if (targetUser.id === currentUser.id && nextStatus === RecordStatus.DISABLED) {
    redirect(buildListPath(USER_LIST_PATH, { notice: "self-status-blocked" }))
  }

  if (
    targetUser.role === Role.ADMIN &&
    targetUser.status === RecordStatus.ENABLED &&
    nextStatus === RecordStatus.DISABLED
  ) {
    const otherEnabledAdminCount = await countEnabledAdmins(targetUser.id)

    if (otherEnabledAdminCount === 0) {
      redirect(buildListPath(USER_LIST_PATH, { notice: "last-admin" }))
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status: nextStatus },
    select: {
      id: true,
      username: true,
      account: true,
      role: true,
      status: true,
      driverProfileId: true,
      driverProfile: {
        select: {
          name: true,
        },
      },
    },
  })

  await createOperationLog({
    actor: currentUser,
    action: OperationAction.UPDATE,
    module: OperationModule.USER_MANAGEMENT,
    businessId: updatedUser.id,
    summary: buildChangeSummary([
      {
        label: "状态",
        before: getUserStatusLabel(targetUser.status),
        after: getUserStatusLabel(updatedUser.status),
      },
    ]),
  })

  revalidateUserPaths()
  redirect(buildListPath(USER_LIST_PATH, { notice: "status-updated" }))
}

export async function resetUserPassword(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const currentUser = await requireAdminAccess()

  const id = getTextValue(formData, "id")
  const validated = resetPasswordSchema.safeParse({
    password: getTextValue(formData, "password"),
    confirmPassword: getTextValue(formData, "confirmPassword"),
  })

  if (!validated.success) {
    return createErrorState(validated.error.flatten().fieldErrors)
  }

  const targetUser = await getUserForLog(id)
  const hashedPassword = await hashPassword(validated.data.password)

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  })

  if (targetUser) {
    await createOperationLog({
      actor: currentUser,
      action: OperationAction.RESET_PASSWORD,
      module: OperationModule.USER_MANAGEMENT,
      businessId: targetUser.id,
      summary: buildSnapshotSummary([
        { label: "用户名", value: targetUser.username },
        { label: "账号", value: targetUser.account },
      ]),
    })
  }

  revalidateUserPaths()
  redirect(buildListPath(USER_LIST_PATH, { notice: "password-reset" }))
}

export async function deleteUser(id: string) {
  const currentUser = await requireAdminAccess()

  if (id === currentUser.id) {
    redirect(buildListPath(USER_LIST_PATH, { notice: "self-delete-blocked" }))
  }

  const targetUser = await getUserSummary(id)

  if (!targetUser) {
    redirect(buildListPath(USER_LIST_PATH, { notice: "deleted" }))
  }

  if (targetUser.role === Role.ADMIN && targetUser.status === RecordStatus.ENABLED) {
    const otherEnabledAdminCount = await countEnabledAdmins(targetUser.id)

    if (otherEnabledAdminCount === 0) {
      redirect(buildListPath(USER_LIST_PATH, { notice: "last-admin" }))
    }
  }

  if (getUsageCount(targetUser) > 0) {
    redirect(buildListPath(USER_LIST_PATH, { notice: "in-use" }))
  }

  await prisma.user.delete({
    where: { id },
  })

  await createOperationLog({
    actor: currentUser,
    action: OperationAction.DELETE,
    module: OperationModule.USER_MANAGEMENT,
    businessId: targetUser.id,
    summary: buildSnapshotSummary([
      { label: "用户名", value: targetUser.username },
      { label: "账号", value: targetUser.account },
      { label: "角色", value: getUserRoleLabel(targetUser.role) },
      { label: "状态", value: getUserStatusLabel(targetUser.status) },
      { label: "绑定司机", value: getBoundDriverLabel(targetUser) },
    ]),
  })

  revalidateUserPaths()
  redirect(buildListPath(USER_LIST_PATH, { notice: "deleted" }))
}