"use client"

import { useState } from "react"
import type { Session } from "next-auth"

import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  session?: Session | null
}

export function DashboardLayoutClient({ children, session }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          aria-label="关闭导航菜单"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <Sidebar
        session={session || null}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />
      <Navbar session={session || null} onMenuClick={() => setMobileNavOpen(true)} />
      <main className="min-h-screen min-w-0 pt-16 lg:ml-64">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}

export function DashboardLayout({ children, session }: DashboardLayoutProps) {
  return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>
}
