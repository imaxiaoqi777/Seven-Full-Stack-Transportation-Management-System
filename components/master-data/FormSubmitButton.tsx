"use client"

import { useFormStatus } from "react-dom"

interface FormSubmitButtonProps {
  label: string
  pendingLabel?: string
}

export function FormSubmitButton({
  label,
  pendingLabel = "提交中...",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
