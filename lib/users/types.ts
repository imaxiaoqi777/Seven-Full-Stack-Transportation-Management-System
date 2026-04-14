export type UserFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
}

export type UserPageSearchParams = Promise<{
  keyword?: string | string[]
  page?: string | string[]
  notice?: string | string[]
}>

export type DriverBindingOption = {
  id: string
  name: string
  phone: string
  status: "ENABLED" | "DISABLED"
  boundUser?: {
    id: string
    username: string
    account: string
  } | null
}