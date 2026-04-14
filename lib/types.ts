export type User = {
  id: string
  username: string
  account: string
  role: "ADMIN" | "DRIVER"
  status: "ENABLED" | "DISABLED"
  createdAt: Date
  updatedAt: Date
}

export type RecordStatus = "ENABLED" | "DISABLED"

export type ContainerType = {
  id: string
  name: string
  code: string | null
  status: RecordStatus
  remark: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type VehiclePlate = {
  id: string
  plateNumber: string
  vehicleType: string | null
  teamName: string | null
  status: RecordStatus
  remark: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type Driver = {
  id: string
  name: string
  phone: string
  defaultVehicleId: string | null
  status: RecordStatus
  remark: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type DropLocation = {
  id: string
  name: string
  province: string
  city: string
  district: string
  detailAddress: string
  fullAddress: string
  contactName: string | null
  contactPhone: string | null
  status: RecordStatus
  remark: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type Load = {
  id: string
  loadNumber: string
  status: "DRAFT" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "COMPLETED" | "CANCELLED"
  destination: string
  containerTypeId: string
  blNumber: string
  vesselVoyage: string | null
  containerNumber: string
  sealNumber: string | null
  dropLocationId: string
  vehicleId: string
  driverId: string
  operatorUserId: string
  remark: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}