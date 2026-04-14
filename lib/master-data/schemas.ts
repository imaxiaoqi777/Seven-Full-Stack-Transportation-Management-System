import { RecordStatus } from "@prisma/client"
import { z } from "zod"

import { PHONE_REGEX } from "@/lib/utils"

const SOCIAL_CREDIT_CODE_REGEX = /^[0-9A-Z]{18}$/

const statusField = z.nativeEnum(RecordStatus, {
  error: "请选择状态。",
})

const optionalShortText = z
  .string()
  .trim()
  .max(50, "长度不能超过 50 个字符。")
  .optional()

const optionalLongText = z
  .string()
  .trim()
  .max(500, "备注不能超过 500 个字符。")
  .optional()

export const containerTypeSchema = z.object({
  name: z.string().trim().min(1, "请输入箱型名称。").max(50, "箱型名称不能超过 50 个字符。"),
  code: optionalShortText,
  status: statusField,
  remark: optionalLongText,
})

export const companySchema = z.object({
  name: z.string().trim().min(1, "请输入公司名称。").max(100, "公司名称不能超过 100 个字符。"),
  socialCreditCode: z
    .string()
    .trim()
    .min(1, "请输入统一社会信用代码。")
    .regex(SOCIAL_CREDIT_CODE_REGEX, "请输入 18 位统一社会信用代码。"),
  contactName: z.string().trim().min(1, "请输入联系人姓名。").max(50, "联系人姓名不能超过 50 个字符。"),
  contactPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "请输入有效的中国大陆手机号。"),
  status: statusField,
  remark: optionalLongText,
})

export const vehiclePlateSchema = z.object({
  plateNumber: z
    .string()
    .trim()
    .min(1, "请输入车牌号。")
    .max(20, "车牌号不能超过 20 个字符。"),
  vehicleType: optionalShortText,
  teamName: optionalShortText,
  status: statusField,
  remark: optionalLongText,
})

export const driverSchema = z.object({
  name: z.string().trim().min(1, "请输入司机姓名。").max(50, "司机姓名不能超过 50 个字符。"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "请输入有效的中国大陆手机号。"),
  defaultVehicleId: z.string().trim().optional(),
  status: statusField,
  remark: optionalLongText,
})

export const dropLocationSchema = z.object({
  name: z.string().trim().min(1, "请输入地点名称。").max(100, "地点名称不能超过 100 个字符。"),
  province: z.string().trim().min(1, "请选择省份。"),
  city: z.string().trim().min(1, "请选择城市。"),
  district: z.string().trim().min(1, "请选择区县。"),
  detailAddress: z
    .string()
    .trim()
    .min(1, "请输入详细地址。")
    .max(200, "详细地址不能超过 200 个字符。"),
  contactName: optionalShortText,
  contactPhone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || PHONE_REGEX.test(value), "请输入有效的联系人手机号。"),
  status: statusField,
  remark: optionalLongText,
})
