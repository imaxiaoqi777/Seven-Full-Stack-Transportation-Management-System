"use client"

import { useState, type ReactNode } from "react"
import type { LoadStatus } from "@prisma/client"

import { formatLoadAmount, getLoadStatusColor, getLoadStatusLabel } from "@/lib/loads/utils"

export type LoadDetailPayload = {
  loadNumber: string
  pickupAtLabel: string
  destination: string
  vesselVoyage: string | null
  blNumber: string
  containerNumber: string
  sealNumber: string | null
  companyName: string | null
  companySocialCreditCode: string | null
  containerTypeName: string
  dropLocationName: string
  dropLocationAddress: string
  vehiclePlate: string
  driverName: string
  driverPhone: string
  operatorUsername: string
  operatorRoleLabel: string
  status: LoadStatus
  totalFee: number
  gasFee: number
  driverPay: number
  otherFee: number
  otherFeeRemark: string | null
  balanceFee: number
  remark: string | null
  createdAtLabel: string
  updatedAtLabel: string
}

type LoadDetailDialogProps = {
  detail: LoadDetailPayload
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-xs font-medium text-gray-500 sm:w-28">{label}</dt>
      <dd className="min-w-0 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export function LoadDetailDialog({ detail }: LoadDetailDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 transition hover:bg-blue-100"
      >
        详情
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:px-4 sm:py-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[min(100dvh,720px)] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">运单详情</h3>
                <p className="mt-1 truncate text-sm text-gray-500">运单号：{detail.loadNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              >
                关闭
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-800">状态</h4>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getLoadStatusColor(detail.status)}`}
                    >
                      {getLoadStatusLabel(detail.status)}
                    </span>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800">费用明细</h4>
                  <dl className="mt-3 space-y-3 rounded-2xl bg-gray-50 p-4">
                    <DetailRow label="总运费" value={formatLoadAmount(detail.totalFee)} />
                    <DetailRow label="燃气费" value={formatLoadAmount(detail.gasFee)} />
                    <DetailRow label="司机工资" value={formatLoadAmount(detail.driverPay)} />
                    <DetailRow label="其他费用" value={formatLoadAmount(detail.otherFee)} />
                    <DetailRow
                      label="其他费用说明"
                      value={detail.otherFeeRemark?.trim() ? detail.otherFeeRemark : "—"}
                    />
                    <DetailRow
                      label="结余"
                      value={
                        <span className="font-semibold text-emerald-700">
                          {formatLoadAmount(detail.balanceFee)}
                        </span>
                      }
                    />
                  </dl>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800">运单信息</h4>
                  <dl className="mt-3 space-y-3">
                    <DetailRow label="提箱时间" value={detail.pickupAtLabel} />
                    <DetailRow label="目的地" value={detail.destination} />
                    <DetailRow label="公司" value={detail.companyName ? detail.companyName : "未选择公司"} />
                    {detail.companySocialCreditCode ? (
                      <DetailRow label="信用代码" value={detail.companySocialCreditCode} />
                    ) : null}
                    <DetailRow label="提单号" value={detail.blNumber} />
                    <DetailRow label="船名航次" value={detail.vesselVoyage || "未填写"} />
                  </dl>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800">箱务与地点</h4>
                  <dl className="mt-3 space-y-3">
                    <DetailRow label="箱型" value={detail.containerTypeName} />
                    <DetailRow label="箱号" value={detail.containerNumber} />
                    <DetailRow label="封号" value={detail.sealNumber || "未填写"} />
                    <DetailRow label="落箱地点" value={detail.dropLocationName} />
                    <DetailRow label="地址" value={detail.dropLocationAddress} />
                  </dl>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800">车辆与人员</h4>
                  <dl className="mt-3 space-y-3">
                    <DetailRow label="车牌" value={detail.vehiclePlate} />
                    <DetailRow label="司机" value={`${detail.driverName} / ${detail.driverPhone}`} />
                    <DetailRow
                      label="操作人员"
                      value={`${detail.operatorUsername} / ${detail.operatorRoleLabel}`}
                    />
                  </dl>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-800">备注与时间</h4>
                  <dl className="mt-3 space-y-3">
                    <DetailRow label="备注" value={detail.remark?.trim() ? detail.remark : "—"} />
                    <DetailRow label="创建时间" value={detail.createdAtLabel} />
                    <DetailRow label="修改时间" value={detail.updatedAtLabel} />
                  </dl>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
