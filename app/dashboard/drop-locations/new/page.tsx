import { DropLocationForm } from "@/components/master-data/DropLocationForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"

export default async function NewDropLocationPage() {
  await requireAdminAccess()

  return (
    <PageShell
      title="新增落箱地点"
      description="使用中国省市区三级联动录入落箱地点和联系人信息。"
    >
      <DropLocationForm backHref="/dashboard/drop-locations" />
    </PageShell>
  )
}
