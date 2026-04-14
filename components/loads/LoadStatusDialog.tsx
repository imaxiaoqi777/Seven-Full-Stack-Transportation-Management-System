"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"

import { LOAD_STATUS_OPTIONS } from "@/lib/loads/constants"
import { getLoadStatusColor, getLoadStatusLabel } from "@/lib/loads/utils"
import type { LoadStatus } from "@prisma/client"

type LoadStatusDialogProps = {
  currentStatus: LoadStatus
  loadNumber: string
  action: (formData: FormData) => void | Promise<void>
}

function StatusSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? "保存中..." : "确认修改"}
    </button>
  )
}

export function LoadStatusDialog({
  currentStatus,
  loadNumber,
  action,
}: LoadStatusDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<LoadStatus>(currentStatus)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedStatus(currentStatus)
          setOpen(true)
        }}
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition hover:scale-[1.02] hover:shadow-sm ${getLoadStatusColor(currentStatus)}`}
      >
        {getLoadStatusLabel(currentStatus)}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">修改运单状态</h3>
                <p className="mt-2 text-sm text-gray-500">
                  运单“{loadNumber}”当前状态为
                  <span className="mx-1 font-medium text-gray-900">
                    {getLoadStatusLabel(currentStatus)}
                  </span>
                  ，请选择要更新到的新状态。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              >
                关闭
              </button>
            </div>

            <form action={action} className="mt-6 space-y-5">
              <input type="hidden" name="status" value={selectedStatus} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LOAD_STATUS_OPTIONS.map((option) => {
                  const active = option.value === selectedStatus

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getLoadStatusColor(option.value)}`}
                        >
                          {option.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {active ? "当前准备切换到这个状态。" : "点击选择这个状态。"}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                修改后列表会立即刷新，当前筛选和分页位置会保持不变。
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  取消
                </button>
                <StatusSubmitButton disabled={selectedStatus === currentStatus} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
