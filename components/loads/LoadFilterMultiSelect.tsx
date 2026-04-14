type LoadFilterMultiSelectOption = {
  value: string
  label: string
  meta?: string
}

type LoadFilterMultiSelectProps = {
  name: string
  label: string
  placeholder: string
  selectedValues: string[]
  options: LoadFilterMultiSelectOption[]
  helperText?: string
}

function getSummaryText(
  placeholder: string,
  selectedValues: string[],
  options: LoadFilterMultiSelectOption[]
) {
  if (selectedValues.length === 0) {
    return placeholder
  }

  const labelMap = new Map(options.map((option) => [option.value, option.label]))
  const selectedLabels = selectedValues
    .map((value) => labelMap.get(value))
    .filter((value): value is string => Boolean(value))

  if (selectedLabels.length === 0) {
    return `已选 ${selectedValues.length} 项`
  }

  if (selectedLabels.length <= 2) {
    return selectedLabels.join("、")
  }

  return `${selectedLabels.slice(0, 2).join("、")} 等 ${selectedLabels.length} 项`
}

export function LoadFilterMultiSelect({
  name,
  label,
  placeholder,
  selectedValues,
  options,
  helperText,
}: LoadFilterMultiSelectProps) {
  const summaryText = getSummaryText(placeholder, selectedValues, options)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <details className="group relative mt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition marker:hidden hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 group-open:border-blue-500">
          <span className="min-w-0 truncate">{summaryText}</span>
          <span className="ml-3 shrink-0 text-gray-400 transition group-open:rotate-180">⌄</span>
        </summary>
        <div className="absolute left-0 z-20 mt-2 max-h-72 w-full min-w-[16rem] overflow-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">暂无可选项</p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={selectedValues.includes(option.value)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm text-gray-700">{option.label}</span>
                  {option.meta ? (
                    <span className="block text-xs text-gray-500">{option.meta}</span>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </div>
      </details>
      {helperText ? <p className="mt-1 text-xs text-gray-500">{helperText}</p> : null}
    </div>
  )
}
