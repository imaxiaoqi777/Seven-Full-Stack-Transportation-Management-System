import { PageShell } from "@/components/master-data/PageShell"
import { UserForm } from "@/components/users/UserForm"
import { requireAdminAccess } from "@/lib/auth-service"
import { getDriverBindingOptions } from "@/lib/users/queries"

export default async function NewUserPage() {
  await requireAdminAccess()
  const driverOptions = await getDriverBindingOptions()

  return (
    <PageShell
      title="新增用户"
      description="创建新的管理员或司机账号。司机账号必须绑定司机管理中的司机资料。"
    >
      <UserForm backHref="/dashboard/users" driverOptions={driverOptions} />
    </PageShell>
  )
}