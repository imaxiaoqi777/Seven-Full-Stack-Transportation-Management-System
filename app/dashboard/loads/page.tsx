import Link from "next/link"

import { LoadDetailDialog } from "@/components/loads/LoadDetailDialog"
import { LoadFiltersForm } from "@/components/loads/LoadFiltersForm"
import { LoadStatusDialog } from "@/components/loads/LoadStatusDialog"
import { ConfirmSubmitButton } from "@/components/master-data/ConfirmSubmitButton"
import { EmptyState } from "@/components/master-data/EmptyState"
import { NoticeBanner } from "@/components/master-data/NoticeBanner"
import { PageShell } from "@/components/master-data/PageShell"
import { Pagination } from "@/components/master-data/Pagination"
import { requireModuleAccess } from "@/lib/auth-service"
import { deleteLoad, updateLoadStatus } from "@/lib/loads/actions"
import {
  getLoadFilterCompanyOptions,
  getLoadFilterContainerTypeOptions,
  getLoadFilterDriverOptions,
  getLoadFilterVehicleOptions,
  getLoadList,
} from "@/lib/loads/queries"
import type { LoadPageSearchParams } from "@/lib/loads/types"
import {
  buildLoadExportPath,
  buildLoadListPath,
  formatLoadAmount,
  formatLoadDateTimeLabel,
  getLoadListQueryParams,
  getLoadNoticeMessage,
  resolveLoadListParams,
} from "@/lib/loads/utils"
import { getUserRoleLabel } from "@/lib/users/utils"

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: LoadPageSearchParams
}) {
  const currentUser = await requireModuleAccess("loads")
  const { filters, page, notice } = await resolveLoadListParams(searchParams)

  const [listResult, companyOptions, containerTypeOptions, driverOptions, vehicleOptions] =
    await Promise.all([
      getLoadList({
        filters,
        page,
        currentUserId: currentUser.id,
        currentUserRole: currentUser.role,
      }),
      getLoadFilterCompanyOptions(currentUser.id, currentUser.role),
      getLoadFilterContainerTypeOptions(currentUser.id, currentUser.role),
      getLoadFilterDriverOptions(currentUser.id, currentUser.role),
      getLoadFilterVehicleOptions(currentUser.id, currentUser.role),
    ])

  const { items, total, totalPages } = listResult
  const noticeMessage = getLoadNoticeMessage(notice)
  const isDriverUser = currentUser.role === "DRIVER"
  const currentListPath = buildLoadListPath(filters, page)

  return (
    <PageShell
      title="运单管理"
      description={
        isDriverUser
          ? "这里仅展示你自己有权限查看的运单，可按公司、箱型、司机、车牌号和提箱日期范围筛选。"
          : "支持按公司、箱型、司机、车牌号、提单号、运单号和提箱日期范围组合筛选，并可导出当前结果。"
      }
      action={
        <Link
          href="/dashboard/loads/new"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          新建运单
        </Link>
      }
    >
      {noticeMessage ? <NoticeBanner message={noticeMessage} /> : null}

      {isDriverUser ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          当前司机账号只能查看和操作自己有权限的运单，筛选项也会按你的可见范围展示。
        </div>
      ) : null}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-5">
          <LoadFiltersForm
            filters={filters}
            companyOptions={companyOptions}
            containerTypeOptions={containerTypeOptions}
            driverOptions={driverOptions}
            vehicleOptions={vehicleOptions}
            exportHref={buildLoadExportPath(filters)}
          />
          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 lg:flex-row lg:items-center lg:justify-between">
            <p>共 {total} 条运单</p>
            <p>翻页、改状态、删除和导出都会保留当前筛选条件。</p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="没有符合条件的运单"
            description={
              isDriverUser
                ? "可以调整筛选条件，或者新增一条属于你自己的运单。"
                : "可以调整筛选条件，或者从“新建运单”开始录入新的运单信息。"
            }
          />
        ) : (
          <>
            <div className="min-w-0 overflow-x-auto">
              <table className="min-w-[1100px] divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">运单信息</th>
                    <th className="px-6 py-3 font-medium">箱务信息</th>
                    <th className="px-6 py-3 font-medium">落箱地点</th>
                    <th className="px-6 py-3 font-medium">车辆与人员</th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">状态与费用</th>
                    <th className="px-6 py-3 font-medium">提箱日期</th>
                    <th className="px-6 py-3 font-medium">修改时间</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.loadNumber}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          公司：{item.company ? item.company.name : "未选择公司"}
                        </div>
                        {item.company?.socialCreditCode ? (
                          <div className="mt-1 text-xs text-gray-500">
                            信用代码：{item.company.socialCreditCode}
                          </div>
                        ) : null}
                        <div className="mt-1 text-xs text-gray-500">目的地：{item.destination}</div>
                        <div className="mt-1 text-xs text-gray-500">提单号：{item.blNumber}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          船名航次：{item.vesselVoyage || "未填写"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.containerType.name}</div>
                        <div className="mt-1 text-xs text-gray-500">箱号：{item.containerNumber}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          封号：{item.sealNumber || "未填写"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.dropLocation.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{item.dropLocation.fullAddress}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>车牌：{item.vehicle.plateNumber}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          司机：{item.driver.name} / {item.driver.phone}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          操作人员：{item.operatorUser.username} / {getUserRoleLabel(item.operatorUser.role)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <div className="shrink-0">
                              <LoadStatusDialog
                                currentStatus={item.status}
                                loadNumber={item.loadNumber}
                                action={updateLoadStatus.bind(null, item.id, currentListPath)}
                              />
                            </div>
                            <span className="whitespace-nowrap text-xs text-gray-600">
                              总运费 {formatLoadAmount(item.totalFee)}
                              <span className="mx-1.5 text-gray-300">|</span>
                              结余{" "}
                              <span className="font-medium text-emerald-700">
                                {formatLoadAmount(item.balanceFee)}
                              </span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">点击状态可弹窗修改</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatLoadDateTimeLabel(item.pickupAt)}</td>
                      <td className="px-6 py-4">{item.updatedAt.toLocaleString("zh-CN")}</td>
                      <td className="px-6 py-4">
                        <div className="flex min-w-[10rem] flex-wrap items-center gap-2">
                          <LoadDetailDialog
                            detail={{
                              loadNumber: item.loadNumber,
                              pickupAtLabel: formatLoadDateTimeLabel(item.pickupAt),
                              destination: item.destination,
                              vesselVoyage: item.vesselVoyage,
                              blNumber: item.blNumber,
                              containerNumber: item.containerNumber,
                              sealNumber: item.sealNumber,
                              companyName: item.company?.name ?? null,
                              companySocialCreditCode: item.company?.socialCreditCode ?? null,
                              containerTypeName: item.containerType.name,
                              dropLocationName: item.dropLocation.name,
                              dropLocationAddress: item.dropLocation.fullAddress,
                              vehiclePlate: item.vehicle.plateNumber,
                              driverName: item.driver.name,
                              driverPhone: item.driver.phone,
                              operatorUsername: item.operatorUser.username,
                              operatorRoleLabel: getUserRoleLabel(item.operatorUser.role),
                              status: item.status,
                              totalFee: Number(item.totalFee),
                              gasFee: Number(item.gasFee),
                              driverPay: Number(item.driverPay),
                              otherFee: Number(item.otherFee),
                              otherFeeRemark: item.otherFeeRemark,
                              balanceFee: Number(item.balanceFee),
                              remark: item.remark,
                              createdAtLabel: item.createdAt.toLocaleString("zh-CN"),
                              updatedAtLabel: item.updatedAt.toLocaleString("zh-CN"),
                            }}
                          />
                          <Link
                            href={`/dashboard/loads/${item.id}/edit`}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                          >
                            编辑
                          </Link>
                          <form action={deleteLoad.bind(null, item.id, currentListPath)}>
                            <ConfirmSubmitButton
                              label="删除"
                              pendingLabel="删除中..."
                              confirmMessage={`确认删除运单“${item.loadNumber}”吗？`}
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
              pathname="/dashboard/loads"
              page={page}
              totalPages={totalPages}
              params={getLoadListQueryParams(filters)}
            />
          </>
        )}
      </div>
    </PageShell>
  )
}
