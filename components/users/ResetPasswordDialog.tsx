"use client"

import { useActionState, useState } from "react"

import { FieldError } from "@/components/master-data/FieldError"
import { FormSubmitButton } from "@/components/master-data/FormSubmitButton"
import { resetUserPassword } from "@/lib/users/actions"
import type { UserFormState } from "@/lib/users/types"

type ResetPasswordDialogProps = {
  userId: string
  username: string
}

const initialState: UserFormState = {}

export function ResetPasswordDialog({ userId, username }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(resetUserPassword, initialState)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-700 transition hover:bg-blue-50"
      >
        重置密码
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900">重置密码</h3>
              <p className="mt-2 text-sm text-gray-500">
                为用户“{username}”设置新的登录密码。保存后将立即生效。
              </p>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              <input type="hidden" name="id" value={userId} />

              {state.message ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.message}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700">新密码</label>
                <input
                  name="password"
                  type="password"
                  placeholder="请输入新密码"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <FieldError error={state.errors?.password?.[0]} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">确认新密码</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <FieldError error={state.errors?.confirmPassword?.[0]} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  取消
                </button>
                <FormSubmitButton label="保存新密码" pendingLabel="保存中..." />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
