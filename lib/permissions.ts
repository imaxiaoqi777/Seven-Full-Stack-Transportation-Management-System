import { Session } from "next-auth"

export const PERMISSION_MAP = {
  ADMIN: [
    "dashboard",
    "users",
    "operation-logs",
    "container-types",
    "companies",
    "vehicles",
    "drivers",
    "drop-locations",
    "loads",
  ],
  DRIVER: [
    "dashboard",
    "loads",
  ],
}

export function hasPermission(role: string, module: string): boolean {
  const permissions = PERMISSION_MAP[role as keyof typeof PERMISSION_MAP]
  if (!permissions) return false
  return permissions.includes(module)
}

export function isAdmin(role?: string): boolean {
  return role === "ADMIN"
}

export function isDriver(role?: string): boolean {
  return role === "DRIVER"
}

export function canAccessResource(
  userRole: string,
  userId: string,
  resourceCreatedBy: string
): boolean {
  if (isAdmin(userRole)) {
    return true
  }

  if (isDriver(userRole)) {
    return userId === resourceCreatedBy
  }

  return false
}

export function getUserPermissions(role: string): string[] {
  return PERMISSION_MAP[role as keyof typeof PERMISSION_MAP] || []
}

export function checkUserPermission(
  session: Session | null,
  requiredModule: string
): boolean {
  if (!session?.user?.role) {
    return false
  }

  return hasPermission(session.user.role, requiredModule)
}

export function getUserRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    ADMIN: "管理员",
    DRIVER: "司机",
  }
  return roleLabels[role] || "未知"
}
