import { ContainerTypeForm } from "@/components/master-data/ContainerTypeForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"

export default async function NewContainerTypePage() {
  await requireAdminAccess()

  return (
    <PageShell
      title="新增箱型"
      description="填写箱型名称、编码、状态和备注信息。"
    >
      <ContainerTypeForm backHref="/dashboard/container-types" />
    </PageShell>
  )
}
