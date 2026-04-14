import Link from "next/link"

import { LoadFilterMultiSelect } from "@/components/loads/LoadFilterMultiSelect"
import type {
  LoadFilterCompanyOption,
  LoadFilterContainerTypeOption,
  LoadFilterDriverOption,
  LoadFilterVehicleOption,
  LoadListFilters,
} from "@/lib/loads/types"

type LoadFiltersFormProps = {
  filters: LoadListFilters
  companyOptions: LoadFilterCompanyOption[]
  containerTypeOptions: LoadFilterContainerTypeOption[]
  driverOptions: LoadFilterDriverOption[]
  vehicleOptions: LoadFilterVehicleOption[]
  exportHref: string
}

export function LoadFiltersForm({
  filters,
  companyOptions,
  containerTypeOptions,
  driverOptions,
  vehicleOptions,
  exportHref,
}: LoadFiltersFormProps) {
  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" method="get">
      <LoadFilterMultiSelect
        name="companyIds"
        label="公司"
        placeholder="请选择公司"
        selectedValues={filters.companyIds}
        options={companyOptions.map((company) => ({
          value: company.id,
          label: company.name,
          meta: company.socialCreditCode || undefined,
        }))}
        helperText="支持多选，下拉后勾选需要查询的公司。"
      />

      <LoadFilterMultiSelect
        name="containerTypeIds"
        label="箱型"
        placeholder="请选择箱型"
        selectedValues={filters.containerTypeIds}
        options={containerTypeOptions.map((containerType) => ({
          value: containerType.id,
          label: containerType.name,
          meta: containerType.code || undefined,
        }))}
        helperText="支持多选，下拉后勾选需要查询的箱型。"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">提单号</label>
        <input
          name="blNumber"
          defaultValue={filters.blNumber}
          placeholder="请输入提单号"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">运单号</label>
        <input
          name="loadNumber"
          defaultValue={filters.loadNumber}
          placeholder="请输入运单号"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <LoadFilterMultiSelect
        name="driverIds"
        label="司机"
        placeholder="请选择司机"
        selectedValues={filters.driverIds}
        options={driverOptions.map((driver) => ({
          value: driver.id,
          label: driver.name,
          meta: driver.phone,
        }))}
        helperText="支持多选，下拉后勾选需要查询的司机。"
      />

      <LoadFilterMultiSelect
        name="vehicleIds"
        label="车牌号"
        placeholder="请选择车牌号"
        selectedValues={filters.vehicleIds}
        options={vehicleOptions.map((vehicle) => ({
          value: vehicle.id,
          label: vehicle.plateNumber,
          meta:
            [vehicle.vehicleType, vehicle.teamName]
              .filter(Boolean)
              .join(" / ") || undefined,
        }))}
        helperText="支持多选，下拉后勾选需要查询的车牌号。"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">提箱日期从</label>
        <input
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">按当天 00:00:00 起算</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">提箱日期至</label>
        <input
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">按当天 23:59:59 截止</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 md:col-span-2 xl:col-span-4">
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          查询
        </button>
        <Link
          href="/dashboard/loads"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          重置
        </Link>
        <Link
          href={exportHref}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          下载 Excel
        </Link>
      </div>
    </form>
  )
}
