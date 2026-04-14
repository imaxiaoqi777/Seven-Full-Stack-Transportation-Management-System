import { LoadStatus } from "@prisma/client"
import { z } from "zod"

import { buildFullAddress } from "@/lib/master-data/utils"

const statusField = z.nativeEnum(LoadStatus, {
  error: "请选择运单状态。",
})

const requiredSelectField = (label: string) =>
  z.string().trim().min(1, `请选择${label}。`)

const optionalShortText = z
  .string()
  .trim()
  .max(100, "长度不能超过 100 个字符。")
  .optional()

const optionalContainerText = z
  .string()
  .trim()
  .max(50, "长度不能超过 50 个字符。")
  .optional()

const optionalLongText = z
  .string()
  .trim()
  .max(500, "备注不能超过 500 个字符。")
  .optional()

const pickupAtField = z
  .string()
  .trim()
  .min(1, "请选择提箱时间。")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "提箱时间格式不正确。")
  .transform((value) => new Date(value))

function moneyField(label: string, required = false) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value
      }

      const normalized = value.trim()

      if (!normalized) {
        return undefined
      }

      return Number(normalized)
    },
    required
      ? z
          .number({ error: `请输入${label}。` })
          .finite(`${label}格式不正确。`)
          .min(0, `${label}不能小于 0。`)
          .max(99999999.99, `${label}不能超过 99999999.99。`)
      : z
          .number({ error: `${label}格式不正确。` })
          .finite(`${label}格式不正确。`)
          .min(0, `${label}不能小于 0。`)
          .max(99999999.99, `${label}不能超过 99999999.99。`)
          .optional()
  )
}

export const loadSchema = z
  .object({
    pickupAt: pickupAtField,
    destinationProvince: requiredSelectField("目的地省份"),
    destinationCity: requiredSelectField("目的地城市"),
    destinationDistrict: requiredSelectField("目的地区县"),
    destinationDetailAddress: z
      .string()
      .trim()
      .min(1, "请输入目的地详细地址。")
      .max(100, "目的地详细地址不能超过 100 个字符。"),
    companyId: requiredSelectField("公司"),
    containerTypeId: requiredSelectField("箱型"),
    blNumber: z.string().trim().min(1, "请输入提单号。").max(100, "提单号不能超过 100 个字符。"),
    vesselVoyage: optionalShortText,
    containerNumber: z.string().trim().min(1, "请输入箱号。").max(50, "箱号不能超过 50 个字符。"),
    sealNumber: optionalContainerText,
    dropLocationId: requiredSelectField("落箱地点"),
    vehicleId: requiredSelectField("车牌号"),
    driverId: requiredSelectField("司机名称"),
    operatorUserId: requiredSelectField("操作人员"),
    totalFee: moneyField("总费用", true),
    gasFee: moneyField("燃气费"),
    driverPay: moneyField("司机工资"),
    otherFee: moneyField("其他费用"),
    otherFeeRemark: z
      .string()
      .trim()
      .max(200, "其他费用说明不能超过 200 个字符。")
      .optional(),
    status: statusField,
    remark: optionalLongText,
  })
  .superRefine((data, ctx) => {
    const destination = buildFullAddress(
      data.destinationProvince,
      data.destinationCity,
      data.destinationDistrict,
      data.destinationDetailAddress
    )

    if (destination.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "目的地不能超过 100 个字符。",
        path: ["destinationDetailAddress"],
      })
    }

    const totalFee = data.totalFee ?? 0
    const gasFee = data.gasFee ?? 0
    const driverPay = data.driverPay ?? 0
    const otherFee = data.otherFee ?? 0
    const expenseTotal = gasFee + driverPay + otherFee

    if (expenseTotal > totalFee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "总费用不能小于燃气费、司机工资和其他费用之和。",
        path: ["totalFee"],
      })
    }

    if (otherFee > 0 && !data.otherFeeRemark?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "填写其他费用时，请补充说明这笔费用的用途。",
        path: ["otherFeeRemark"],
      })
    }
  })
