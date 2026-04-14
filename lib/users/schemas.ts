import { RecordStatus, Role } from "@prisma/client"
import { z } from "zod"

const accountSchema = z
  .string()
  .trim()
  .min(1, "请输入账号。")
  .max(100, "账号不能超过 100 个字符。")
  .regex(/^[a-zA-Z0-9@._-]+$/, "账号仅支持字母、数字、点、下划线、中划线和 @。")

const usernameSchema = z
  .string()
  .trim()
  .min(2, "请输入用户名。")
  .max(50, "用户名不能超过 50 个字符。")

const passwordSchema = z
  .string()
  .min(6, "密码至少需要 6 个字符。")
  .max(50, "密码不能超过 50 个字符。")

const roleSchema = z.nativeEnum(Role, {
  error: "请选择角色。",
})

const statusSchema = z.nativeEnum(RecordStatus, {
  error: "请选择状态。",
})

const driverProfileIdSchema = z.string().trim().optional()

export const createUserSchema = z
  .object({
    username: usernameSchema,
    account: accountSchema,
    role: roleSchema,
    status: statusSchema,
    driverProfileId: driverProfileIdSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请再次输入密码。"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.role === Role.DRIVER && !data.driverProfileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "司机账号必须绑定司机管理中的司机资料。",
        path: ["driverProfileId"],
      })
    }
  })

export const updateUserSchema = z.object({
  username: usernameSchema,
  role: roleSchema,
  status: statusSchema,
  driverProfileId: driverProfileIdSchema,
}).superRefine((data, ctx) => {
  if (data.role === Role.DRIVER && !data.driverProfileId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "司机账号必须绑定司机管理中的司机资料。",
      path: ["driverProfileId"],
    })
  }
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请再次输入新密码。"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  })