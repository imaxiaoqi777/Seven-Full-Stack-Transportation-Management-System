"use client"

import type { MouseEvent } from "react"
import { useFormStatus } from "react-dom"

interface ConfirmSubmitButtonProps {
  label: string
  confirmMessage: string
  pendingLabel?: string
  className?: string
}

export function ConfirmSubmitButton({
  label,
  confirmMessage,
  pendingLabel = "处理中...",
  className,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus()

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        "rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
