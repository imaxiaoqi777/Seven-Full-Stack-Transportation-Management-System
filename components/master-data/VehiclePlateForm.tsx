"use client"

import Link from "next/link"
import { useActionState } from "react"

import { saveVehiclePlate } from "@/lib/master-data/actions"
import { RECORD_STATUS_OPTIONS } from "@/lib/master-data/constants"
import type { MasterDataFormState } from "@/lib/master-data/types"

import { FieldError } from "./FieldError"
import { FormSubmitButton } from "./FormSubmitButton"

type VehiclePlateFormProps = {
  backHref: string
  initialData?: {
    id?: string
    plateNumber?: string
    vehicleType?: string | null
    teamName?: string | null
    status?: "ENABLED" | "DISABLED"
    remark?: string | null
  }
}

const initialState: MasterDataFormState = {}

export function VehiclePlateForm({
  backHref,
  initialData,
}: VehiclePlateFormProps) {
  const [state, formAction] = useActionState(saveVehiclePlate, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {initialData?.id ? <input type="hidden" name="id" value={initialData.id} /> : null}

      {state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">车牌号</label>
            <input
              name="plateNumber"
              defaultValue={initialData?.plateNumber ?? ""}
              placeholder="例如：粤B12345"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.plateNumber?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">车辆类型</label>
            <input
              name="vehicleType"
              defaultValue={initialData?.vehicleType ?? ""}
              placeholder="可选，例如：牵引车 / 挂车"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.vehicleType?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">所属车队</label>
            <input
              name="teamName"
              defaultValue={initialData?.teamName ?? ""}
              placeholder="可选，例如：华南一队"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.teamName?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              name="status"
              defaultValue={initialData?.status ?? "ENABLED"}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {RECORD_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError error={state.errors?.status?.[0]} />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">备注</label>
          <textarea
            name="remark"
            defaultValue={initialData?.remark ?? ""}
            rows={4}
            placeholder="可填写车牌来源、调度说明等"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <FieldError error={state.errors?.remark?.[0]} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={backHref}
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          取消
        </Link>
        <FormSubmitButton
          label={initialData?.id ? "保存修改" : "新增车牌"}
          pendingLabel={initialData?.id ? "保存中..." : "提交中..."}
        />
      </div>
    </form>
  )
}
