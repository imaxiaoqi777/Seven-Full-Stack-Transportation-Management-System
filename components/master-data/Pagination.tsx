import Link from "next/link"

import { buildListPath } from "@/lib/master-data/utils"

interface PaginationProps {
  pathname: string
  page: number
  totalPages: number
  keyword?: string
  params?: Record<string, string | number | Array<string | number> | undefined>
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const numbers = new Set<number>([1, totalPages, page - 1, page, page + 1])
  return Array.from(numbers)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)
}

function buildPaginationPath(
  pathname: string,
  page: number,
  keyword?: string,
  params?: Record<string, string | number | Array<string | number> | undefined>
) {
  return buildListPath(pathname, {
    ...(params ?? {}),
    keyword: keyword || params?.keyword?.toString() || undefined,
    page,
  })
}

export function Pagination({
  pathname,
  page,
  totalPages,
  keyword,
  params,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        第 {page} / {totalPages} 页
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPaginationPath(pathname, Math.max(1, page - 1), keyword, params)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            page <= 1
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          上一页
        </Link>
        {pageNumbers.map((pageNumber) => (
          <Link
            key={pageNumber}
            href={buildPaginationPath(pathname, pageNumber, keyword, params)}
            className={`rounded-lg px-3 py-2 text-sm ${
              pageNumber === page
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {pageNumber}
          </Link>
        ))}
        <Link
          href={buildPaginationPath(pathname, Math.min(totalPages, page + 1), keyword, params)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            page >= totalPages
              ? "pointer-events-none border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          下一页
        </Link>
      </div>
    </div>
  )
}
