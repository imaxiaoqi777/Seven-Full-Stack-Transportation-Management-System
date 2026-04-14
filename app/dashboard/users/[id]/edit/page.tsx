import { notFound } from "next/navigation"

import { PageShell } from "@/components/master-data/PageShell"
import { UserForm } from "@/components/users/UserForm"
import { requireAdminAccess } from "@/lib/auth-service"
import { getDriverBindingOptions, getUserById } from "@/lib/users/queries"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await requireAdminAccess()
  const { id } = await params
  const user = await getUserById(id)

  if (!user) {
    notFound()
  }

  const driverOptions = await getDriverBindingOptions(user.driverProfileId ?? undefined, user.id)

  return (
    <PageShell
      title="编辑用户"
      description="修改用户名、角色、状态和司机绑定关系。原密码不会展示，如需调整请使用重置密码功能。"
    >
      <UserForm
        backHref="/dashboard/users"
        driverOptions={driverOptions}
        isSelf={currentUser.id === user.id}
        initialData={{
          id: user.id,
          username: user.username,
          account: user.account,
          role: user.role,
          status: user.status,
          driverProfileId: user.driverProfileId,
        }}
      />
    </PageShell>
  )
}