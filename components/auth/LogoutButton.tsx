"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 sm:px-4"
      title="退出登录"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="hidden text-sm sm:inline">{isLoading ? "退出中..." : "退出登录"}</span>
    </button>
  )
}
