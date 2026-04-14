"use client"

import type { Session } from "next-auth"
import { Menu } from "lucide-react"

import { LogoutButton } from "@/components/auth/LogoutButton"

interface NavbarProps {
  session: Session | null
  onMenuClick?: () => void
}

export function Navbar({ session, onMenuClick }: NavbarProps) {
  const user = session?.user
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "用"

  return (
    <nav className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:left-64">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            aria-label="打开导航菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-800 sm:text-lg">
            集装箱运输管理系统
          </h1>
          <p className="hidden text-xs text-gray-500 sm:block">运输运营仪表盘</p>
        </div>
      </div>

      {user ? (
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-2 sm:gap-3 sm:pr-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
              {initials}
            </div>
            <div className="hidden min-w-0 text-sm sm:block">
              <p className="truncate font-medium text-gray-800">{user.name || "用户"}</p>
              <p className="text-xs text-gray-500">
                {user.role === "ADMIN" ? "管理员" : "司机"}
              </p>
            </div>
          </div>

          <LogoutButton />
        </div>
      ) : null}
    </nav>
  )
}

