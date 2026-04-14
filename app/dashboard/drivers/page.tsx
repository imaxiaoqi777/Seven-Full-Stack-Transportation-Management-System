import Link from "next/link"
import { RecordStatus } from "@prisma/client"

import { ConfirmSubmitButton } from "@/components/master-data/ConfirmSubmitButton"
import { EmptyState } from "@/components/master-data/EmptyState"
import { ListSearchForm } from "@/components/master-data/ListSearchForm"
import { NoticeBanner } from "@/components/master-data/NoticeBanner"
import { PageShell } from "@/components/master-data/PageShell"
import { Pagination } from "@/components/master-data/Pagination"
import { StatusBadge } from "@/components/master-data/StatusBadge"
import { deleteDriver, toggleDriverStatus } from "@/lib/master-data/actions"
import { getDriverList } from "@/lib/master-data/queries"
import type { MasterDataPageSearchParams } from "@/lib/master-data/types"
import { getNoticeMessage, resolveMasterDataParams } from "@/lib/master-data/utils"
import { requireAdminAccess } from "@/lib/auth-service"

export default async function DriversPage({
  searchParams,
}: {
  searchParams: MasterDataPageSearchParams
}) {
  await requireAdminAccess()

  const { keyword, page, notice } = await resolveMasterDataParams(searchParams)
  const { items, total, totalPages } = await getDriverList({ keyword, page })
  const noticeMessage = getNoticeMessage(notice)

  return (
    <PageShell
      title="司机管理"
      description="维护司机基础资料、默认车牌和绑定账号信息，支持手机号校验、分页、搜索和删除保护。"
      action={
        <Link
          href="/dashboard/drivers/new"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          新增司机
        </Link>
      }
    >
      {noticeMessage ? <NoticeBanner message={noticeMessage} /> : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <ListSearchForm
            keyword={keyword}
            placeholder="搜索司机姓名、手机号、默认车牌或绑定账号"
            resetHref="/dashboard/drivers"
          />
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="还没有司机数据"
            description="先录入司机和默认车牌信息，后续司机账号会绑定到这里的司机资料。"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">司机姓名</th>
                    <th className="px-6 py-3 font-medium">手机号</th>
                    <th className="px-6 py-3 font-medium">默认车牌</th>
                    <th className="px-6 py-3 font-medium">绑定账号</th>
                    <th className="px-6 py-3 font-medium">状态</th>
                    <th className="px-6 py-3 font-medium">业务引用</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => {
                    const referenceCount = item._count.loadsAsDriver + (item.boundUser ? 1 : 0)

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="mt-1 text-xs text-gray-500">{item.remark || "无备注"}</div>
                        </td>
                        <td className="px-6 py-4">{item.phone}</td>
                        <td className="px-6 py-4">{item.defaultVehicle?.plateNumber || "未设置"}</td>
                        <td className="px-6 py-4">
                          {item.boundUser ? (
                            <div>
                              <div>{item.boundUser.username}</div>
                              <div className="mt-1 text-xs text-gray-500">{item.boundUser.account}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">未绑定</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4">{referenceCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/dashboard/drivers/${item.id}/edit`}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              编辑
                            </Link>
                            <form
                              action={toggleDriverStatus.bind(
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
                            <form action={deleteDriver.bind(null, item.id)}>
                              <ConfirmSubmitButton
                                label="删除"
                                pendingLabel="删除中..."
                                confirmMessage={`确认删除司机“${item.name}”吗？`}
                              />
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pathname="/dashboard/drivers" page={page} totalPages={totalPages} keyword={keyword} />
          </>
        )}
      </div>
    </PageShell>
  )
}