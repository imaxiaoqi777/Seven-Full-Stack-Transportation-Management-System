import { CompanyForm } from "@/components/master-data/CompanyForm"
import { PageShell } from "@/components/master-data/PageShell"
import { requireAdminAccess } from "@/lib/auth-service"

export default async function NewCompanyPage() {
  await requireAdminAccess()

  return (
    <PageShell
      title="新增公司"
      description="填写公司名称、统一社会信用代码和联系人信息。"
    >
      <CompanyForm backHref="/dashboard/companies" />
    </PageShell>
  )
}
