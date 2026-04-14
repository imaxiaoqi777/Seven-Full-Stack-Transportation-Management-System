import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/LoginForm"
import { auth } from "@/lib/auth-config"

function getFirstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string | string[]
  }>
}) {
  const [session, resolvedSearchParams] = await Promise.all([auth(), searchParams])
  const notice = getFirstValue(resolvedSearchParams.notice)

  if (session?.user?.id && session.user.status !== "DISABLED") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.2fr_0.8fr]">
          <section className="hidden bg-slate-950 p-10 text-white lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
              Seven集运调度(1.0.0)
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              车辆、运单、司机和站点信息，都能在一个控制台里统一管理。
            </h1>
            <p className="mt-4 max-w-md text-sm text-slate-300">
              登录后即可进入运输调度后台，处理日常运单与车辆运营信息。
            </p>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                登录
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                集装箱运输管理系统
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                请输入你的账号和密码进入系统。
              </p>
            </div>

            {notice === "disabled" ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                当前账号已被禁用，请联系管理员处理后再登录。
              </div>
            ) : null}

            <LoginForm />

            <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
              面向企业内部运输运营流程打造。
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
