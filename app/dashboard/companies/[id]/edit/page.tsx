import { notFound } from "next/navigation"

import { CompanyForm } from "@/components/master-data/CompanyForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"
import { getCompanyById } from "@/lib/master-data/queries"

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAccess()

  const { id } = await params
  const company = await getCompanyById(id)

  if (!company) {
    notFound()
  }

  return (
    <PageShell
      title="编辑公司"
      description="更新公司基础资料。"
    >
      <CompanyForm
        backHref="/dashboard/companies"
        initialData={{
          id: company.id,
          name: company.name,
          socialCreditCode: company.socialCreditCode,
          contactName: company.contactName,
          contactPhone: company.contactPhone,
          status: company.status,
          remark: company.remark,
        }}
      />
    </PageShell>
  )
}
