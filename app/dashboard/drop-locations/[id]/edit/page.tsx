import { notFound } from "next/navigation"

import { DropLocationForm } from "@/components/master-data/DropLocationForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"
import { getDropLocationById } from "@/lib/master-data/queries"

export default async function EditDropLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAccess()

  const { id } = await params
  const dropLocation = await getDropLocationById(id)

  if (!dropLocation) {
    notFound()
  }

  return (
    <PageShell
      title="编辑落箱地点"
      description="更新地址、联系人和状态信息。"
    >
      <DropLocationForm
        backHref="/dashboard/drop-locations"
        initialData={{
          id: dropLocation.id,
          name: dropLocation.name,
          province: dropLocation.province,
          city: dropLocation.city,
          district: dropLocation.district,
          detailAddress: dropLocation.detailAddress,
          contactName: dropLocation.contactName,
          contactPhone: dropLocation.contactPhone,
          status: dropLocation.status,
          remark: dropLocation.remark,
        }}
      />
    </PageShell>
  )
}
