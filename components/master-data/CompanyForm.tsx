"use client"

import Link from "next/link"
import { useActionState } from "react"

import { saveCompany } from "@/lib/master-data/actions"
import { RECORD_STATUS_OPTIONS } from "@/lib/master-data/constants"
import type { MasterDataFormState } from "@/lib/master-data/types"

import { FieldError } from "./FieldError"
import { FormSubmitButton } from "./FormSubmitButton"

type CompanyFormProps = {
  backHref: string
  initialData?: {
    id?: string
    name?: string
    socialCreditCode?: string
    contactName?: string
    contactPhone?: string
    status?: "ENABLED" | "DISABLED"
    remark?: string | null
  }
}

const initialState: MasterDataFormState = {}

export function CompanyForm({ backHref, initialData }: CompanyFormProps) {
  const [state, formAction] = useActionState(saveCompany, initialState)

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
            <label className="block text-sm font-medium text-gray-700">公司名称</label>
            <input
              name="name"
              defaultValue={initialData?.name ?? ""}
              placeholder="例如：河北某某物流有限公司"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.name?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">统一社会信用代码</label>
            <input
              name="socialCreditCode"
              defaultValue={initialData?.socialCreditCode ?? ""}
              placeholder="请输入 18 位统一社会信用代码"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.socialCreditCode?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系人姓名</label>
            <input
              name="contactName"
              defaultValue={initialData?.contactName ?? ""}
              placeholder="请输入联系人姓名"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.contactName?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">联系人电话</label>
            <input
              name="contactPhone"
              defaultValue={initialData?.contactPhone ?? ""}
              placeholder="请输入联系人手机号"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.contactPhone?.[0]} />
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
            placeholder="可填写账期、结算要求或特殊说明"
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
          label={initialData?.id ? "保存修改" : "新增公司"}
          pendingLabel={initialData?.id ? "保存中..." : "提交中..."}
        />
      </div>
    </form>
  )
}
