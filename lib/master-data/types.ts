export type MasterDataFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
}

export type MasterDataPageSearchParams = Promise<{
  keyword?: string | string[]
  page?: string | string[]
  notice?: string | string[]
}>

export type ResolvedMasterDataParams = {
  keyword: string
  page: number
  notice?: string
}

export type VehicleOption = {
  id: string
  plateNumber: string
}

export type CompanyOption = {
  id: string
  name: string
  socialCreditCode: string
  contactName: string
  contactPhone: string
}
