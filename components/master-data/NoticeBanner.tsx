interface NoticeBannerProps {
  message: string
}

export function NoticeBanner({ message }: NoticeBannerProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      {message}
    </div>
  )
}
