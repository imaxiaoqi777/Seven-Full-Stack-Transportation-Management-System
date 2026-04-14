import type { LoadStatus, RecordStatus, Role } from "@prisma/client"

export type LoadFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
}

export type LoadListFilters = {
  loadNumber: string
  companyIds: string[]
  containerTypeIds: string[]
  blNumber: string
  driverIds: string[]
  vehicleIds: string[]
  dateFrom: string
  dateTo: string
}

export type LoadPageSearchParams = Promise<{
  loadNumber?: string | string[]
  companyIds?: string | string[]
  containerTypeIds?: string | string[]
  blNumber?: string | string[]
  driverIds?: string | string[]
  vehicleIds?: string | string[]
  dateFrom?: string | string[]
  dateTo?: string | string[]
  page?: string | string[]
  notice?: string | string[]
}>

export type LoadFilterCompanyOption = {
  id: string
  name: string
  socialCreditCode: string
}

export type LoadFilterContainerTypeOption = {
  id: string
  name: string
  code: string | null
}

export type LoadFilterDriverOption = {
  id: string
  name: string
  phone: string
}

export type LoadFilterVehicleOption = {
  id: string
  plateNumber: string
  vehicleType: string | null
  teamName: string | null
}

export type ResolvedLoadListParams = {
  filters: LoadListFilters
  page: number
  notice?: string
}

export type LoadFormCurrentUser = {
  id: string
  username: string
  account: string
  role: Role
}

export type ContainerTypeOption = {
  id: string
  name: string
  code: string | null
  status: RecordStatus
}

export type CompanyOption = {
  id: string
  name: string
  socialCreditCode: string
  contactName: string
  contactPhone: string
  status: RecordStatus
}

export type VehicleOption = {
  id: string
  plateNumber: string
  vehicleType: string | null
  teamName: string | null
  status: RecordStatus
}

export type DriverOption = {
  id: string
  name: string
  phone: string
  status: RecordStatus
}

export type DropLocationOption = {
  id: string
  name: string
  fullAddress: string
  status: RecordStatus
}

export type OperatorOption = {
  id: string
  username: string
  account: string
  role: Role
  status: RecordStatus
  driverProfileId: string | null
  driverProfileName: string | null
  driverProfilePhone: string | null
  driverProfileStatus: RecordStatus | null
}

export type LoadFormInitialData = {
  id?: string
  loadNumber?: string
  pickupAtInput?: string
  destination?: string
  companyId?: string | null
  containerTypeId?: string
  blNumber?: string
  vesselVoyage?: string | null
  containerNumber?: string
  sealNumber?: string | null
  dropLocationId?: string
  vehicleId?: string
  driverId?: string
  operatorUserId?: string
  totalFee?: string
  gasFee?: string
  driverPay?: string
  otherFee?: string
  otherFeeRemark?: string | null
  balanceFee?: string
  status?: LoadStatus
  remark?: string | null
  updatedAtLabel?: string
}
