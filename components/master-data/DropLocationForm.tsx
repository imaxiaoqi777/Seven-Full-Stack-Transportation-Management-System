"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { CHINA_REGIONS } from "@/lib/master-data/china-regions"
import { saveDropLocation } from "@/lib/master-data/actions"
import { RECORD_STATUS_OPTIONS } from "@/lib/master-data/constants"
import type { MasterDataFormState } from "@/lib/master-data/types"
import { buildFullAddress } from "@/lib/master-data/utils"

import { FieldError } from "./FieldError"
import { FormSubmitButton } from "./FormSubmitButton"

type DropLocationFormProps = {
  backHref: string
  initialData?: {
    id?: string
    name?: string
    province?: string
    city?: string
    district?: string
    detailAddress?: string
    contactName?: string | null
    contactPhone?: string | null
    status?: "ENABLED" | "DISABLED"
    remark?: string | null
  }
}

const initialState: MasterDataFormState = {}

export function DropLocationForm({
  backHref,
  initialData,
}: DropLocationFormProps) {
  const [state, formAction] = useActionState(saveDropLocation, initialState)
  const [province, setProvince] = useState(initialData?.province ?? "")
  const [city, setCity] = useState(initialData?.city ?? "")
  const [district, setDistrict] = useState(initialData?.district ?? "")
  const [detailAddress, setDetailAddress] = useState(initialData?.detailAddress ?? "")

  const provinceData = CHINA_REGIONS.find((item) => item.name === province)
  const cityOptions = provinceData?.cities ?? []
  const cityData = cityOptions.find((item) => item.name === city)
  const districtOptions = cityData?.districts ?? []
  const fullAddress = buildFullAddress(province, city, district, detailAddress)

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
            <label className="block text-sm font-medium text-gray-700">地点名称</label>
            <input
              name="name"
              defaultValue={initialData?.name ?? ""}
              placeholder="例如：盐田港堆场"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.name?.[0]} />
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

          <div>
            <label className="block text-sm font-medium text-gray-700">省份</label>
            <select
              name="province"
              value={province}
              onChange={(event) => {
                setProvince(event.target.value)
                setCity("")
                setDistrict("")
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">请选择省份</option>
              {CHINA_REGIONS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <FieldError error={state.errors?.province?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">城市</label>
            <select
              name="city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value)
                setDistrict("")
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">请选择城市</option>
              {cityOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <FieldError error={state.errors?.city?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">区县</label>
            <select
              name="district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">请选择区县</option>
              {districtOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <FieldError error={state.errors?.district?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系人</label>
            <input
              name="contactName"
              defaultValue={initialData?.contactName ?? ""}
              placeholder="可选"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.contactName?.[0]} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">详细地址</label>
            <input
              name="detailAddress"
              value={detailAddress}
              onChange={(event) => setDetailAddress(event.target.value)}
              placeholder="请输入街道、门牌号等详细地址"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.detailAddress?.[0]} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">完整地址</label>
            <input
              value={fullAddress}
              readOnly
              placeholder="系统会自动拼接完整地址"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系人手机号</label>
            <input
              name="contactPhone"
              defaultValue={initialData?.contactPhone ?? ""}
              placeholder="可选"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.contactPhone?.[0]} />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">备注</label>
          <textarea
            name="remark"
            defaultValue={initialData?.remark ?? ""}
            rows={4}
            placeholder="可填写作业时间、收货规则等补充说明"
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
          label={initialData?.id ? "保存修改" : "新增地点"}
          pendingLabel={initialData?.id ? "保存中..." : "提交中..."}
        />
      </div>
    </form>
  )
}
