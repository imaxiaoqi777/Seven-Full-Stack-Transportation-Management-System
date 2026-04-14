import Link from "next/link"
import { RecordStatus } from "@prisma/client"

import { ConfirmSubmitButton } from "@/components/master-data/ConfirmSubmitButton"
import { EmptyState } from "@/components/master-data/EmptyState"
import { ListSearchForm } from "@/components/master-data/ListSearchForm"
import { NoticeBanner } from "@/components/master-data/NoticeBanner"
import { PageShell } from "@/components/master-data/PageShell"
import { Pagination } from "@/components/master-data/Pagination"
import { StatusBadge } from "@/components/master-data/StatusBadge"
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog"
import { requireAdminAccess } from "@/lib/auth-service"
import { resolveMasterDataParams } from "@/lib/master-data/utils"
import { deleteUser, toggleUserStatus } from "@/lib/users/actions"
import { getUserList } from "@/lib/users/queries"
import type { UserPageSearchParams } from "@/lib/users/types"
import { getUserNoticeMessage, getUserRoleColor, getUserRoleLabel } from "@/lib/users/utils"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: UserPageSearchParams
}) {
  const currentUser = await requireAdminAccess()
  const { keyword, page, notice } = await resolveMasterDataParams(searchParams)
  const { items, total, totalPages } = await getUserList({ keyword, page })
  const noticeMessage = getUserNoticeMessage(notice)

  return (
    <PageShell
      title="用户管理"
      description="管理系统管理员和司机账号。司机账号必须绑定司机管理中的司机资料，后续运单会按绑定关系校验。"
      action={
        <Link
          href="/dashboard/users/new"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          新增用户
        </Link>
      }
    >
      {noticeMessage ? <NoticeBanner message={noticeMessage} /> : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <ListSearchForm
            keyword={keyword}
            placeholder="搜索用户名、账号、绑定司机或角色"
            resetHref="/dashboard/users"
          />
          <p className="text-sm text-gray-500">共 {total} 个账号</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="还没有用户账号"
            description="可以先新增一个管理员或司机账号，司机账号需要同步绑定司机管理中的司机资料。"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">用户名</th>
                    <th className="px-6 py-3 font-medium">账号</th>
                    <th className="px-6 py-3 font-medium">角色</th>
                    <th className="px-6 py-3 font-medium">绑定司机</th>
                    <th className="px-6 py-3 font-medium">状态</th>
                    <th className="px-6 py-3 font-medium">业务引用</th>
                    <th className="px-6 py-3 font-medium">创建时间</th>
                    <th className="px-6 py-3 font-medium">更新时间</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => {
                    const isSelf = item.id === currentUser.id
                    const usageCount =
                      item._count.containerTypes +
                      item._count.vehiclePlates +
                      item._count.drivers +
                      item._count.dropLocations +
                      item._count.createdLoads +
                      item._count.operatedLoads +
                      item._count.loadHistory

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.username}</span>
                            {isSelf ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                当前账号
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">{item.account}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getUserRoleColor(item.role)}`}>
                            {getUserRoleLabel(item.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.driverProfile ? (
                            <div>
                              <div className="font-medium text-gray-900">{item.driverProfile.name}</div>
                              <div className="mt-1 text-xs text-gray-500">{item.driverProfile.phone}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">未绑定</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4">{usageCount}</td>
                        <td className="px-6 py-4">{item.createdAt.toLocaleString("zh-CN")}</td>
                        <td className="px-6 py-4">{item.updatedAt.toLocaleString("zh-CN")}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/dashboard/users/${item.id}/edit`}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              编辑
                            </Link>
                            <ResetPasswordDialog userId={item.id} username={item.username} />
                            {!isSelf ? (
                              <form
                                action={toggleUserStatus.bind(
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
                            ) : null}
                            {!isSelf ? (
                              <form action={deleteUser.bind(null, item.id)}>
                                <ConfirmSubmitButton
                                  label="删除"
                                  pendingLabel="删除中..."
                                  confirmMessage={`确认删除用户“${item.username}”吗？`}
                                />
                              </form>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pathname="/dashboard/users" page={page} totalPages={totalPages} keyword={keyword} />
          </>
        )}
      </div>
    </PageShell>
  )
}