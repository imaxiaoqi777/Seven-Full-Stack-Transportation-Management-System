import { LoadForm } from "@/components/loads/LoadForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireModuleAccess } from "@/lib/auth-service"
import { getLoadFormOptions } from "@/lib/loads/queries"

export default async function NewLoadPage() {
  const currentUser = await requireModuleAccess("loads")
  const options = await getLoadFormOptions(currentUser.id, currentUser.role)

  return (
    <PageShell
      title="新建运单"
      description="录入所属公司、目的地、箱型、提单号、箱号、落箱地点、车牌号和费用明细，并按司机绑定关系自动确定司机名称与操作人员。"
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
      />
    </PageShell>
  )
}
