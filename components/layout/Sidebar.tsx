"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Session } from "next-auth"
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react"

interface SidebarProps {
  session: Session | null
  mobileOpen?: boolean
  onNavigate?: () => void
}

const menuItems = [
  {
    label: "概览",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "DRIVER"],
  },
  {
    label: "运单管理",
    href: "/dashboard/loads",
    icon: ShoppingCart,
    roles: ["ADMIN", "DRIVER"],
  },
  {
    label: "箱型管理",
    href: "/dashboard/container-types",
    icon: Package,
    roles: ["ADMIN"],
  },
  {
    label: "公司管理",
    href: "/dashboard/companies",
    icon: Building2,
    roles: ["ADMIN"],
  },
  {
    label: "车牌管理",
    href: "/dashboard/vehicles",
    icon: Truck,
    roles: ["ADMIN"],
  },
  {
    label: "司机管理",
    href: "/dashboard/drivers",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "落箱地点",
    href: "/dashboard/drop-locations",
    icon: MapPin,
    roles: ["ADMIN"],
  },
  {
    label: "用户管理",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "操作日志",
    href: "/dashboard/operation-logs",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
]

export function Sidebar({ session, mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const role = session?.user?.role ?? "DRIVER"
  const visibleItems = menuItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900 text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-16 items-center border-b border-gray-800 px-4">
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 text-lg font-bold"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
            CT
          </div>
          <div>
            <p>集运调度</p>
            <p className="text-xs font-normal text-gray-400">调度中心</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
