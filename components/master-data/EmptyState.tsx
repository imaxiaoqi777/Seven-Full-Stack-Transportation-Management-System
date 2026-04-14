interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
        暂无数据
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  )
}