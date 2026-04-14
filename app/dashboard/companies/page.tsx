import Link from "next/link"
import { RecordStatus } from "@prisma/client"

import { ConfirmSubmitButton } from "@/components/master-data/ConfirmSubmitButton"
import { EmptyState } from "@/components/master-data/EmptyState"
import { ListSearchForm } from "@/components/master-data/ListSearchForm"
import { NoticeBanner } from "@/components/master-data/NoticeBanner"
import { PageShell } from "@/components/master-data/PageShell"
import { Pagination } from "@/components/master-data/Pagination"
import { StatusBadge } from "@/components/master-data/StatusBadge"
import { requireAdminAccess } from "@/lib/auth-service"
import {
  deleteCompany,
  toggleCompanyStatus,
} from "@/lib/master-data/actions"
import { getCompanyList } from "@/lib/master-data/queries"
import type { MasterDataPageSearchParams } from "@/lib/master-data/types"
import {
  getNoticeMessage,
  resolveMasterDataParams,
} from "@/lib/master-data/utils"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: MasterDataPageSearchParams
}) {
  await requireAdminAccess()

  const { keyword, page, notice } = await resolveMasterDataParams(searchParams)
  const { items, total, totalPages } = await getCompanyList({ keyword, page })
  const noticeMessage = getNoticeMessage(notice)

  return (
    <PageShell
      title="公司管理"
      description="维护运单使用的公司资料，支持搜索、分页、状态切换和删除保护。"
      action={
        <Link
          href="/dashboard/companies/new"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          新增公司
        </Link>
      }
    >
      {noticeMessage ? <NoticeBanner message={noticeMessage} /> : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <ListSearchForm
            keyword={keyword}
            placeholder="搜索公司名称、统一社会信用代码、联系人或手机号"
            resetHref="/dashboard/companies"
          />
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="还没有公司数据"
            description="可以先新增委托公司资料，后续新建运单时就能直接选择。"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">公司信息</th>
                    <th className="px-6 py-3 font-medium">联系人</th>
                    <th className="px-6 py-3 font-medium">状态</th>
                    <th className="px-6 py-3 font-medium">运单引用</th>
                    <th className="px-6 py-3 font-medium">更新时间</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          统一社会信用代码：{item.socialCreditCode}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{item.remark || "无备注"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.contactName}</div>
                        <div className="mt-1 text-xs text-gray-500">{item.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">{item._count.loads}</td>
                      <td className="px-6 py-4">{item.updatedAt.toLocaleString("zh-CN")}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/companies/${item.id}/edit`}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                          >
                            编辑
                          </Link>
                          <form
                            action={toggleCompanyStatus.bind(
                              null,
                              item.id,
                              item.status === RecordStatus.ENABLED
                                ? RecordStatus.DISABLED
                                : RecordStatus.ENABLED
                            )}
                          >
                            <button className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm text-amber-700 transition hover:bg-amber-50">
                              {item.status === RecordStatus.ENABLED ? "禁用" : "启用"}
                            </button>
                          </form>
                          <form action={deleteCompany.bind(null, item.id)}>
                            <ConfirmSubmitButton
                              label="删除"
                              pendingLabel="删除中..."
                              confirmMessage={`确认删除公司“${item.name}”吗？`}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pathname="/dashboard/companies"
              page={page}
              totalPages={totalPages}
              keyword={keyword}
            />
          </>
        )}
      </div>
    </PageShell>
  )
}
