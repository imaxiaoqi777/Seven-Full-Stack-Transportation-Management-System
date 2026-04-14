import Link from "next/link"

interface ListSearchFormProps {
  keyword: string
  placeholder: string
  resetHref: string
}

export function ListSearchForm({
  keyword,
  placeholder,
  resetHref,
}: ListSearchFormProps) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row" method="get">
      <input
        name="keyword"
        defaultValue={keyword}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-80"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          搜索
        </button>
        <Link
          href={resetHref}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          重置
        </Link>
      </div>
    </form>
  )
}
