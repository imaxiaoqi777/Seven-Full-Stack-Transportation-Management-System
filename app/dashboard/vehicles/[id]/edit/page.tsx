import { notFound } from "next/navigation"

import { PageShell } from "@/components/master-data/PageShell"
import { VehiclePlateForm } from "@/components/master-data/VehiclePlateForm"
import { requireAdminAccess } from "@/lib/auth-service"
import { getVehiclePlateById } from "@/lib/master-data/queries"

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAccess()

  const { id } = await params
  const vehicle = await getVehiclePlateById(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <PageShell
      title="编辑车牌"
      description="更新车牌号、车辆类型、状态和备注信息。"
    >
      <VehiclePlateForm
        backHref="/dashboard/vehicles"
        initialData={{
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          vehicleType: vehicle.vehicleType,
          teamName: vehicle.teamName,
          status: vehicle.status,
          remark: vehicle.remark,
        }}
      />
    </PageShell>
  )
}
