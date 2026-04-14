import { DriverForm } from "@/components/master-data/DriverForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"
import { getVehicleOptions } from "@/lib/master-data/queries"

export default async function NewDriverPage() {
  await requireAdminAccess()

  const vehicleOptions = await getVehicleOptions()

  return (
    <PageShell
      title="新增司机"
      description="填写司机姓名、手机号、默认车牌和状态信息。"
    >
      <DriverForm
        backHref="/dashboard/drivers"
        vehicleOptions={vehicleOptions}
      />
    </PageShell>
  )
}
