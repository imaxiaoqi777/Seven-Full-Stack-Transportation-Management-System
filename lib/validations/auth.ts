import { z } from "zod"

const accountSchema = z
  .string()
  .trim()
  .min(1, "请输入账号。")
  .max(100, "账号不能超过 100 个字符。")
  .regex(/^[a-zA-Z0-9@._-]+$/, "账号仅支持字母、数字、点、下划线、中划线和 @。")

const passwordSchema = z
  .string()
  .min(1, "请输入密码。")
  .min(6, "密码至少需要 6 个字符。")

export const loginSchema = z.object({
  account: accountSchema,
  password: passwordSchema,
  rememberMe: z.boolean().default(false).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    account: accountSchema,
    username: z.string().trim().min(2, "用户名至少需要 2 个字符。").max(50, "用户名不能超过 50 个字符。"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "请再次输入密码。"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  })

export type RegisterFormData = z.infer<typeof registerSchema>
