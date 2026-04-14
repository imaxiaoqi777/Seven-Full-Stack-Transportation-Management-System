"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { AlertCircle } from "lucide-react"

import { loginSchema, type LoginFormData } from "@/lib/validations/auth"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      account: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const result = await signIn("credentials", {
        account: data.account,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage(result.error || "账号或密码不正确。")
        return
      }

      if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setErrorMessage("暂时无法登录，请稍后再试。")
      console.error("登录错误:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="account" className="mb-2 block text-sm font-medium text-slate-700">
            账号
          </label>
          <input
            id="account"
            type="text"
            placeholder="请输入账号"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
              errors.account
                ? "border-red-500 focus:border-red-500"
                : "border-slate-300 focus:border-blue-500"
            }`}
            {...register("account")}
            disabled={isLoading}
          />
          {errors.account ? (
            <p className="mt-1 text-sm text-red-500">{errors.account.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
            密码
          </label>
          <input
            id="password"
            type="password"
            placeholder="请输入密码"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
              errors.password
                ? "border-red-500 focus:border-red-500"
                : "border-slate-300 focus:border-blue-500"
            }`}
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
            {...register("rememberMe")}
            disabled={isLoading}
          />
          保持登录状态
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  )
}
