import { notFound } from "next/navigation"

import { ContainerTypeForm } from "@/components/master-data/ContainerTypeForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"
import { getContainerTypeById } from "@/lib/master-data/queries"

export default async function EditContainerTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAccess()

  const { id } = await params
  const containerType = await getContainerTypeById(id)

  if (!containerType) {
    notFound()
  }

  return (
    <PageShell
      title="编辑箱型"
      description="更新箱型基础资料。"
    >
      <ContainerTypeForm
        backHref="/dashboard/container-types"
        initialData={{
          id: containerType.id,
          name: containerType.name,
          code: containerType.code,
          status: containerType.status,
          remark: containerType.remark,
        }}
      />
    </PageShell>
  )
}
