import { notFound } from "next/navigation"

import { DriverForm } from "@/components/master-data/DriverForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"
import { getDriverById, getVehicleOptions } from "@/lib/master-data/queries"

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAccess()

  const { id } = await params
  const [driver, vehicleOptions] = await Promise.all([
    getDriverById(id),
    getVehicleOptions(),
  ])

  if (!driver) {
    notFound()
  }

  return (
    <PageShell
      title="编辑司机"
      description="更新司机手机号、默认车牌和状态信息。"
    >
      <DriverForm
        backHref="/dashboard/drivers"
        vehicleOptions={vehicleOptions}
        initialData={{
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          defaultVehicleId: driver.defaultVehicleId,
          status: driver.status,
          remark: driver.remark,
        }}
      />
    </PageShell>
  )
}
