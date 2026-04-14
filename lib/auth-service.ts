import type { Session } from "next-auth"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth-config"
import { hasPermission } from "@/lib/permissions"

export async function getSession(): Promise<Session | null> {
  return auth()
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.status === "DISABLED") {
    redirect("/login?notice=disabled")
  }

  return session.user
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return Boolean(session?.user?.id && session.user.status !== "DISABLED")
}

export async function getUserRole(): Promise<string | undefined> {
  const session = await getSession()
  return session?.user?.role
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === "ADMIN"
}

export async function isDriver(): Promise<boolean> {
  const role = await getUserRole()
  return role === "DRIVER"
}

export async function requireModuleAccess(moduleName: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.status === "DISABLED") {
    redirect("/login?notice=disabled")
  }

  if (!hasPermission(session.user.role, moduleName)) {
    redirect("/dashboard")
  }

  return session.user
}

export async function requireAdminAccess() {
  return requireModuleAccess("users")
}

