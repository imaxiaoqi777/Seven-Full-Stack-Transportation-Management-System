import { DatabaseBackupPanel } from "@/components/operation-logs/DatabaseBackupPanel"
import { EmptyState } from "@/components/master-data/EmptyState"
import { ListSearchForm } from "@/components/master-data/ListSearchForm"
import { PageShell } from "@/components/master-data/PageShell"
import { Pagination } from "@/components/master-data/Pagination"
import { requireModuleAccess } from "@/lib/auth-service"
import { getOperationLogList } from "@/lib/operation-logs/queries"
import type { OperationLogPageSearchParams } from "@/lib/operation-logs/types"
import {
  getOperationActionColor,
  getOperationActionLabel,
  getOperationModuleLabel,
} from "@/lib/operation-logs/utils"
import { resolveMasterDataParams } from "@/lib/master-data/utils"

export default async function OperationLogsPage({
  searchParams,
}: {
  searchParams: OperationLogPageSearchParams
}) {
  await requireModuleAccess("operation-logs")

  const { keyword, page } = await resolveMasterDataParams(searchParams)
  const { items, total, totalPages } = await getOperationLogList({ keyword, page })

  return (
    <PageShell
      title="操作日志"
      description="集中查看用户管理、基础资料管理和运单管理的新增、编辑、删除、重置密码等操作记录；并可在此导出全库 SQL 备份。"
    >
      <DatabaseBackupPanel />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <ListSearchForm
            keyword={keyword}
            placeholder="搜索操作人、模块、业务ID、操作类型或变更摘要"
            resetHref="/dashboard/operation-logs"
          />
          <p className="text-sm text-gray-500">共 {total} 条日志</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="还没有操作日志"
            description="系统会在用户管理、基础资料管理和运单管理发生新增、编辑、删除、重置密码时自动写入日志。"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">操作时间</th>
                    <th className="px-6 py-3 font-medium">操作人</th>
                    <th className="px-6 py-3 font-medium">操作模块</th>
                    <th className="px-6 py-3 font-medium">操作类型</th>
                    <th className="px-6 py-3 font-medium">业务ID</th>
                    <th className="px-6 py-3 font-medium">变更摘要</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.createdAt.toLocaleString("zh-CN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.actorUsername}</div>
                        <div className="mt-1 text-xs text-gray-500">{item.actorAccount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOperationModuleLabel(item.module)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOperationActionColor(item.action)}`}
                        >
                          {getOperationActionLabel(item.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {item.businessId ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pathname="/dashboard/operation-logs"
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