import { notFound } from "next/navigation"

import { LoadForm } from "@/components/loads/LoadForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireModuleAccess } from "@/lib/auth-service"
import { getLoadById, getLoadFormOptions } from "@/lib/loads/queries"
import { formatLoadDateTimeInput } from "@/lib/loads/utils"

export default async function EditLoadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await requireModuleAccess("loads")
  const { id } = await params
  const load = await getLoadById(id, currentUser.id, currentUser.role)

  if (!load) {
    notFound()
  }

  const options = await getLoadFormOptions(currentUser.id, currentUser.role, {
    companyId: load.companyId,
    containerTypeId: load.containerTypeId,
    dropLocationId: load.dropLocationId,
    driverId: load.driverId,
    vehicleId: load.vehicleId,
    operatorUserId: load.operatorUserId,
  })

  return (
    <PageShell
      title="编辑运单"
      description="更新运单的所属公司、目的地、箱务、费用、车辆和人员信息，司机名称会始终跟随操作人员绑定的司机资料。"
    >
      <LoadForm
        backHref="/dashboard/loads"
        currentUser={{
          id: currentUser.id,
          username: currentUser.username,
          account: currentUser.account,
          role: currentUser.role,
        }}
        companyOptions={options.companies}
        containerTypeOptions={options.containerTypes}
        vehicleOptions={options.vehicles}
        driverOptions={options.drivers}
        dropLocationOptions={options.dropLocations}
        operatorOptions={options.operatorUsers}
        initialData={{
          id: load.id,
          loadNumber: load.loadNumber,
          pickupAtInput: formatLoadDateTimeInput(load.pickupAt),
          destination: load.destination,
          companyId: load.companyId,
          containerTypeId: load.containerTypeId,
          blNumber: load.blNumber,
          vesselVoyage: load.vesselVoyage,
          containerNumber: load.containerNumber,
          sealNumber: load.sealNumber,
          dropLocationId: load.dropLocationId,
          vehicleId: load.vehicleId,
          driverId: load.driverId,
          operatorUserId: load.operatorUserId,
          totalFee: load.totalFee.toFixed(2),
          gasFee: load.gasFee.toFixed(2),
          driverPay: load.driverPay.toFixed(2),
          otherFee: load.otherFee.toFixed(2),
          otherFeeRemark: load.otherFeeRemark,
          balanceFee: load.balanceFee.toFixed(2),
          status: load.status,
          remark: load.remark,
          updatedAtLabel: load.updatedAt.toLocaleString("zh-CN"),
        }}
      />
    </PageShell>
  )
}
