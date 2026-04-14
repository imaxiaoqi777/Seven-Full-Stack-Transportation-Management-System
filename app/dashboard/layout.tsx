import { redirect } from "next/navigation"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { auth } from "@/lib/auth-config"

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.status === "DISABLED") {
    redirect("/login?notice=disabled")
  }

  return <DashboardLayout session={session}>{children}</DashboardLayout>
}
