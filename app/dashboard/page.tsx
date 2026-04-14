import { CalendarRange, FileText, Package, Truck, WalletCards } from "lucide-react"

import { DatabaseBackupSchedule } from "@/components/dashboard/DatabaseBackupSchedule"
import { EmptyState } from "@/components/master-data/EmptyState"
import { requireModuleAccess } from "@/lib/auth-service"
import { getDashboardOverview } from "@/lib/dashboard/queries"
import { formatLoadAmount, getLoadStatusColor, getLoadStatusLabel } from "@/lib/loads/utils"

const metricDefinitions = [
  {
    key: "totalLoads",
    label: "运单总数",
    note: "当前权限范围内可查看的运单总量",
    icon: FileText,
    accent: "bg-blue-100 text-blue-600",
    formatter: (value: number) => value.toLocaleString("zh-CN"),
  },
  {
    key: "activeVehicleCount",
    label: "在用车辆",
    note: "当前执行中的运单所占用车辆数",
    icon: Truck,
    accent: "bg-amber-100 text-amber-600",
    formatter: (value: number) => value.toLocaleString("zh-CN"),
  },
  {
    key: "balanceFeeTotal",
    label: "费用结余",
    note: "运费扣除燃气费、司机工资和其他费用后的累计结余",
    icon: WalletCards,
    accent: "bg-emerald-100 text-emerald-600",
    formatter: (value: number) => formatLoadAmount(value),
  },
  {
    key: "monthLoads",
    label: "本月运单量",
    note: "本月 1 日至今新建的运单数量",
    icon: CalendarRange,
    accent: "bg-violet-100 text-violet-600",
    formatter: (value: number) => value.toLocaleString("zh-CN"),
  },
] as const

const feeCards = [
  { key: "totalFee", label: "运费", note: "当前权限范围内所有运单的费用总额" },
  { key: "gasFee", label: "燃气费", note: "已录入的燃气费用累计" },
  { key: "driverPay", label: "司机工资", note: "已录入的司机工资累计" },
  { key: "otherFee", label: "其他费用", note: "包含高速费、停车费等额外支出" },
  { key: "balanceFee", label: "结余", note: "运费减去各项支出后的余额" },
] as const

export default async function DashboardPage() {
  const currentUser = await requireModuleAccess("dashboard")
  const overview = await getDashboardOverview(currentUser.id, currentUser.role)
  const isDriverUser = currentUser.role === "DRIVER"

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">概览</h1>
        <p className="mt-2 text-sm text-gray-500">
          {isDriverUser
            ? "这里展示的是你当前有权限查看的运单统计、费用汇总和最近业务动态。"
            : "快速查看当前调度业务的关键统计、费用汇总和最近运单动态。"}
        </p>
      </div>

      <DatabaseBackupSchedule canManageBackup={currentUser.role === "ADMIN"} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricDefinitions.map((metric) => {
          const Icon = metric.icon
          const value = overview[metric.key]

          return (
            <div key={metric.key} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{metric.formatter(value)}</p>
                  <p className="mt-2 text-xs text-gray-500">{metric.note}</p>
                </div>
                <div className={`rounded-2xl p-3 ${metric.accent}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">费用概览</h2>
            <p className="mt-1 text-sm text-gray-500">按当前权限范围汇总所有运单的费用明细</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            结余 {formatLoadAmount(overview.feeSummary.balanceFee)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {feeCards.map((item) => (
            <div key={item.key} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatLoadAmount(overview.feeSummary[item.key])}
              </p>
              <p className="mt-2 text-xs text-gray-500">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">最近运单</h2>
            <span className="text-sm text-gray-500">按最近更新时间排序</span>
          </div>

          {overview.recentLoads.length === 0 ? (
            <EmptyState
              title="还没有运单数据"
              description={
                isDriverUser
                  ? "你名下还没有可查看的运单，后续新增或分配后会在这里显示。"
                  : "系统中还没有运单数据，新增运单后这里会自动展示最近动态。"
              }
            />
          ) : (
            <div className="mt-4 space-y-3">
              {overview.recentLoads.map((load) => (
                <div
                  key={load.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{load.loadNumber}</p>
                      <p className="mt-1 truncate text-sm text-gray-600">目的地：{load.destination}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        车牌：{load.vehicle.plateNumber} / 操作人员：{load.operatorUser.username}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        更新时间：{load.updatedAt.toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getLoadStatusColor(load.status)}`}
                    >
                      {getLoadStatusLabel(load.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">运单状态概览</h2>
            <span className="text-sm text-gray-500">按当前权限范围统计</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {overview.statusSummary.map((item) => (
              <div
                key={item.status}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-100">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getLoadStatusLabel(item.status)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">当前状态下的运单数量</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {item.count.toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
