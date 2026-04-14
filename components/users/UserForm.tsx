"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { FieldError } from "@/components/master-data/FieldError"
import { FormSubmitButton } from "@/components/master-data/FormSubmitButton"
import { saveUser } from "@/lib/users/actions"
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "@/lib/users/constants"
import type { DriverBindingOption, UserFormState } from "@/lib/users/types"

type UserFormProps = {
  backHref: string
  isSelf?: boolean
  driverOptions: DriverBindingOption[]
  initialData?: {
    id?: string
    username?: string
    account?: string
    role?: "ADMIN" | "DRIVER"
    status?: "ENABLED" | "DISABLED"
    driverProfileId?: string | null
  }
}

const initialState: UserFormState = {}

export function UserForm({ backHref, driverOptions, initialData, isSelf = false }: UserFormProps) {
  const [state, formAction] = useActionState(saveUser, initialState)
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "DRIVER">(
    initialData?.role ?? "DRIVER"
  )
  const isEditing = Boolean(initialData?.id)
  const requiresDriverBinding = selectedRole === "DRIVER"

  return (
    <form action={formAction} className="space-y-6">
      {initialData?.id ? <input type="hidden" name="id" value={initialData.id} /> : null}

      {state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      {isEditing && isSelf ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前登录账号仅支持修改用户名。角色与状态已锁定，避免误操作影响当前会话。
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              name="username"
              defaultValue={initialData?.username ?? ""}
              placeholder="请输入用户名"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.username?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">账号</label>
            <input
              name="account"
              defaultValue={initialData?.account ?? ""}
              placeholder="例如：admin@example.com"
              readOnly={isEditing}
              className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                isEditing
                  ? "border border-gray-200 bg-gray-50 text-gray-500"
                  : "border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            />
            <FieldError error={state.errors?.account?.[0]} />
            {isEditing ? (
              <p className="mt-1 text-xs text-gray-500">编辑时账号只读，如需调整建议新建账号并停用旧账号。</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">角色</label>
            <select
              name="role"
              defaultValue={initialData?.role ?? "DRIVER"}
              disabled={isSelf}
              onChange={(event) => setSelectedRole(event.target.value as "ADMIN" | "DRIVER")}
              className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                isSelf
                  ? "border border-gray-200 bg-gray-50 text-gray-500"
                  : "border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isSelf ? <input type="hidden" name="role" value={initialData?.role ?? "ADMIN"} /> : null}
            <FieldError error={state.errors?.role?.[0]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select
              name="status"
              defaultValue={initialData?.status ?? "ENABLED"}
              disabled={isSelf}
              className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                isSelf
                  ? "border border-gray-200 bg-gray-50 text-gray-500"
                  : "border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            >
              {USER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isSelf ? <input type="hidden" name="status" value={initialData?.status ?? "ENABLED"} /> : null}
            <FieldError error={state.errors?.status?.[0]} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">绑定司机资料</label>
            {requiresDriverBinding ? (
              <>
                <select
                  name="driverProfileId"
                  defaultValue={initialData?.driverProfileId ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">请选择司机管理中的司机</option>
                  {driverOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} / {option.phone}
                      {option.status === "DISABLED" ? " / 已禁用" : ""}
                      {option.boundUser ? ` / 已绑定：${option.boundUser.username}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  司机账号必须和司机管理中的司机资料一一绑定，后续运单会按这个绑定关系自动校验。
                </p>
              </>
            ) : (
              <>
                <input type="hidden" name="driverProfileId" value="" />
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  当前为管理员账号，无需绑定司机资料。
                </div>
              </>
            )}
            <FieldError error={state.errors?.driverProfileId?.[0]} />
          </div>

          {!isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">登录密码</label>
                <input
                  name="password"
                  type="password"
                  placeholder="至少 6 位密码"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <FieldError error={state.errors?.password?.[0]} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">确认密码</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <FieldError error={state.errors?.confirmPassword?.[0]} />
              </div>
            </>
          ) : null}
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
          label={isEditing ? "保存修改" : "新增用户"}
          pendingLabel={isEditing ? "保存中..." : "提交中..."}
        />
      </div>
    </form>
  )
}