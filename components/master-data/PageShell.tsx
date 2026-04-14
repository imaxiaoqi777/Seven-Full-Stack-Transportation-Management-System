import type { ReactNode } from "react"

interface PageShellProps {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}

export function PageShell({ title, description, action, children }: PageShellProps) {
  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
