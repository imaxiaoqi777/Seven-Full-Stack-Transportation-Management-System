"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { FieldError } from "@/components/master-data/FieldError"
import { FormSubmitButton } from "@/components/master-data/FormSubmitButton"
import { saveLoad } from "@/lib/loads/actions"
import { LOAD_STATUS_OPTIONS } from "@/lib/loads/constants"
import {
  formatLoadAmount,
  formatLoadDateTimeInput,
  formatLoadDateTimeLabel,
} from "@/lib/loads/utils"
import type {
  CompanyOption,
  ContainerTypeOption,
  DriverOption,
  DropLocationOption,
  LoadFormCurrentUser,
  LoadFormInitialData,
  LoadFormState,
  OperatorOption,
  VehicleOption,
} from "@/lib/loads/types"
import { CHINA_REGIONS } from "@/lib/master-data/china-regions"
import { buildFullAddress, parseRegionAddress } from "@/lib/master-data/utils"
import { getUserRoleLabel } from "@/lib/users/utils"

type LoadFormProps = {
  backHref: string
  currentUser: LoadFormCurrentUser
  companyOptions: CompanyOption[]
  containerTypeOptions: ContainerTypeOption[]
  vehicleOptions: VehicleOption[]
  driverOptions: DriverOption[]
  dropLocationOptions: DropLocationOption[]
  operatorOptions: OperatorOption[]
  initialData?: LoadFormInitialData
}

const initialState: LoadFormState = {}

function getStatusSuffix(status: "ENABLED" | "DISABLED") {
  return status === "DISABLED" ? "（已禁用）" : ""
}

function parseMoneyInput(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return 0
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoneyInput(value?: string | null, fallback = "0") {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : fallback
}

function formatMoneyPreview(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}

export function LoadForm({
  backHref,
  currentUser,
  companyOptions,
  containerTypeOptions,
  vehicleOptions,
  driverOptions,
  dropLocationOptions,
  operatorOptions,
  initialData,
}: LoadFormProps) {
  const [state, formAction] = useActionState(saveLoad, initialState)
  const isEditing = Boolean(initialData?.id)
  const isDriverUser = currentUser.role === "DRIVER"
  const isAdminUser = currentUser.role === "ADMIN"

  const initialDestination = parseRegionAddress(initialData?.destination)

  const [selectedCompanyId, setSelectedCompanyId] = useState(initialData?.companyId ?? "")
  const [selectedOperatorUserId, setSelectedOperatorUserId] = useState(
    initialData?.operatorUserId ?? (isDriverUser || isAdminUser ? currentUser.id : "")
  )
  const [selectedDriverId, setSelectedDriverId] = useState(initialData?.driverId ?? "")
  const [destinationProvince, setDestinationProvince] = useState(initialDestination.province)
  const [destinationCity, setDestinationCity] = useState(initialDestination.city)
  const [destinationDistrict, setDestinationDistrict] = useState(initialDestination.district)
  const [destinationDetailAddress, setDestinationDetailAddress] = useState(
    initialDestination.detailAddress
  )
  const [pickupAt, setPickupAt] = useState(formatLoadDateTimeInput(initialData?.pickupAtInput))
  const [totalFee, setTotalFee] = useState(formatMoneyInput(initialData?.totalFee, ""))
  const [gasFee, setGasFee] = useState(formatMoneyInput(initialData?.gasFee))
  const [driverPay, setDriverPay] = useState(formatMoneyInput(initialData?.driverPay))
  const [otherFee, setOtherFee] = useState(formatMoneyInput(initialData?.otherFee))

  const selectedCompany =
    companyOptions.find((option) => option.id === selectedCompanyId) ?? null
  const selectedOperator =
    operatorOptions.find((option) => option.id === selectedOperatorUserId) ?? null
  const selectedDriver = driverOptions.find((option) => option.id === selectedDriverId) ?? null
  const isAdminSelfOperator = isAdminUser && selectedOperatorUserId === currentUser.id
  const lockOperatorSelection = isDriverUser || isAdminSelfOperator
  const resolvedDriverId = selectedOperator?.driverProfileId ?? ""
  const effectiveDriverId = isAdminSelfOperator ? selectedDriverId : resolvedDriverId
  const driverDisplayName = selectedOperator?.driverProfileName ?? ""
  const driverDisplayPhone = selectedOperator?.driverProfilePhone ?? ""
  const driverMissingBinding =
    !isAdminSelfOperator && selectedOperatorUserId !== "" && !selectedOperator?.driverProfileId

  const provinceOptions = CHINA_REGIONS
  const selectedProvinceData = provinceOptions.find((item) => item.name === destinationProvince)
  const cityOptions = selectedProvinceData?.cities ?? []
  const selectedCityData = cityOptions.find((item) => item.name === destinationCity)
  const districtOptions = selectedCityData?.districts ?? []
  const fullDestination = buildFullAddress(
    destinationProvince,
    destinationCity,
    destinationDistrict,
    destinationDetailAddress
  )
  const hasLegacyDestinationFallback =
    Boolean(initialData?.destination) &&
    !initialDestination.province &&
    !initialDestination.city &&
    !initialDestination.district &&
    Boolean(initialDestination.detailAddress)

  const totalFeeValue = parseMoneyInput(totalFee)
  const gasFeeValue = parseMoneyInput(gasFee)
  const driverPayValue = parseMoneyInput(driverPay)
  const otherFeeValue = parseMoneyInput(otherFee)
  const expenseTotal = gasFeeValue + driverPayValue + otherFeeValue
  const balanceFeeValue = totalFeeValue - expenseTotal
  const hasOtherFee = otherFeeValue > 0
  const pickupAtPreview = formatLoadDateTimeLabel(pickupAt, "请填写提箱时间")

  return (
    <form action={formAction} className="space-y-6">
      {initialData?.id ? <input type="hidden" name="id" value={initialData.id} /> : null}
      {!isAdminSelfOperator ? <input type="hidden" name="driverId" value={effectiveDriverId} /> : null}

      {state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      {isDriverUser ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前登录司机账号只能查看和操作自己的运单，操作人员与司机名称都会自动锁定为你绑定的司机资料。
        </div>
      ) : (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          先选择“操作人员”，系统会自动带出该账号绑定的司机名称，司机名称和操作人员必须始终是同一人。
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">所属公司</label>
              <select
                name="companyId"
                value={selectedCompanyId}
                onChange={(event) => setSelectedCompanyId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择公司</option>
                {companyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {getStatusSuffix(option.status)}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.companyId?.[0]} />
              <div className="mt-2 rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-600">
                {selectedCompany ? (
                  <>
                    <div>统一社会信用代码：{selectedCompany.socialCreditCode}</div>
                    <div className="mt-1">
                      联系人：{selectedCompany.contactName} / {selectedCompany.contactPhone}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">选择公司后会展示信用代码和联系人信息</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">箱型</label>
              <select
                name="containerTypeId"
                defaultValue={initialData?.containerTypeId ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择箱型</option>
                {containerTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.code ? ` / ${option.code}` : ""}
                    {getStatusSuffix(option.status)}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.containerTypeId?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">目的地省份</label>
              <select
                name="destinationProvince"
                value={destinationProvince}
                onChange={(event) => {
                  setDestinationProvince(event.target.value)
                  setDestinationCity("")
                  setDestinationDistrict("")
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择省份</option>
                {provinceOptions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.destinationProvince?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">目的地城市</label>
              <select
                name="destinationCity"
                value={destinationCity}
                onChange={(event) => {
                  setDestinationCity(event.target.value)
                  setDestinationDistrict("")
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择城市</option>
                {cityOptions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.destinationCity?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">目的地区县</label>
              <select
                name="destinationDistrict"
                value={destinationDistrict}
                onChange={(event) => setDestinationDistrict(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择区县</option>
                {districtOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.destinationDistrict?.[0]} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">目的地详细地址</label>
              <input
                name="destinationDetailAddress"
                value={destinationDetailAddress}
                onChange={(event) => setDestinationDetailAddress(event.target.value)}
                placeholder="请输入街道、门牌号、园区、码头等详细地址"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.destinationDetailAddress?.[0]} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">完整目的地</label>
              <input
                value={fullDestination}
                readOnly
                placeholder="系统会自动拼接完整目的地"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 outline-none"
              />
              {hasLegacyDestinationFallback ? (
                <p className="mt-1 text-xs text-amber-700">
                  这条历史运单原来是自由填写地址，请重新选择省市区后再保存。
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">提箱时间</label>
              <input
                type="datetime-local"
                name="pickupAt"
                value={pickupAt}
                step={1}
                onChange={(event) => setPickupAt(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.pickupAt?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">提单号</label>
              <input
                name="blNumber"
                defaultValue={initialData?.blNumber ?? ""}
                placeholder="请输入提单号"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.blNumber?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">船名航次</label>
              <input
                name="vesselVoyage"
                defaultValue={initialData?.vesselVoyage ?? ""}
                placeholder="选填，例如：EVERGREEN / 123E"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.vesselVoyage?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">箱号</label>
              <input
                name="containerNumber"
                defaultValue={initialData?.containerNumber ?? ""}
                placeholder="请输入箱号"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.containerNumber?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">封号</label>
              <input
                name="sealNumber"
                defaultValue={initialData?.sealNumber ?? ""}
                placeholder="选填"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <FieldError error={state.errors?.sealNumber?.[0]} />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">费用明细</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    结余会根据运费减去燃气费、司机工资和其他费用自动计算。
                  </p>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    balanceFeeValue < 0
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  当前结余：{formatLoadAmount(balanceFeeValue)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">运费</label>
                  <input
                    type="number"
                    name="totalFee"
                    value={totalFee}
                    min="0"
                    step="0.01"
                    onChange={(event) => setTotalFee(event.target.value)}
                    placeholder="例如 3200.00"
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <FieldError error={state.errors?.totalFee?.[0]} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">燃气费</label>
                  <input
                    type="number"
                    name="gasFee"
                    value={gasFee}
                    min="0"
                    step="0.01"
                    onChange={(event) => setGasFee(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <FieldError error={state.errors?.gasFee?.[0]} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">司机工资</label>
                  <input
                    type="number"
                    name="driverPay"
                    value={driverPay}
                    min="0"
                    step="0.01"
                    onChange={(event) => setDriverPay(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <FieldError error={state.errors?.driverPay?.[0]} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">其他费用</label>
                  <input
                    type="number"
                    name="otherFee"
                    value={otherFee}
                    min="0"
                    step="0.01"
                    onChange={(event) => setOtherFee(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <FieldError error={state.errors?.otherFee?.[0]} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">结余</label>
                  <input
                    value={formatMoneyPreview(balanceFeeValue)}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">其他费用说明</label>
                <input
                  name="otherFeeRemark"
                  defaultValue={initialData?.otherFeeRemark ?? ""}
                  placeholder="例如：高速费、停车费、装卸费等"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <FieldError error={state.errors?.otherFeeRemark?.[0]} />
                <p className={`mt-1 text-xs ${hasOtherFee ? "text-amber-700" : "text-gray-500"}`}>
                  {hasOtherFee
                    ? "已填写其他费用时，请同步写明这笔费用的用途。"
                    : "如果没有其他费用，可以留空。"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">落箱地点</label>
              <select
                name="dropLocationId"
                defaultValue={initialData?.dropLocationId ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择落箱地点</option>
                {dropLocationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} / {option.fullAddress}
                    {getStatusSuffix(option.status)}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.dropLocationId?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">车牌号</label>
              <select
                name="vehicleId"
                defaultValue={initialData?.vehicleId ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">请选择车牌号</option>
                {vehicleOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.plateNumber}
                    {option.vehicleType ? ` / ${option.vehicleType}` : ""}
                    {option.teamName ? ` / ${option.teamName}` : ""}
                    {getStatusSuffix(option.status)}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.vehicleId?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">司机名称</label>
              {isAdminSelfOperator ? (
                <>
                  <select
                    name="driverId"
                    value={selectedDriverId}
                    onChange={(event) => setSelectedDriverId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">璇烽€夋嫨鍙告満</option>
                    {driverOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} / {option.phone}
                        {getStatusSuffix(option.status)}
                      </option>
                    ))}
                  </select>
                  {selectedDriver ? (
                    <p className="mt-2 text-xs text-gray-500">{selectedDriver.phone}</p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      绠＄悊鍛樹綔涓烘搷浣滀汉鍛樻椂锛岃鍗曠嫭閫夋嫨鏈杩愬崟鐨勫徃鏈恒€?
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {selectedOperator ? (
                  selectedOperator.driverProfileId ? (
                    <>
                      <div className="font-medium text-gray-900">{driverDisplayName}</div>
                      <div className="mt-1 text-xs text-gray-500">{driverDisplayPhone}</div>
                    </>
                  ) : (
                    <span className="text-amber-700">
                      该操作人员还没有绑定司机管理中的司机资料。
                    </span>
                  )
                ) : (
                  <span className="text-gray-400">请先选择操作人员</span>
                )}
                </div>
              )}
              <FieldError error={state.errors?.driverId?.[0]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">操作人员</label>
              {lockOperatorSelection ? (
                <>
                  <input type="hidden" name="operatorUserId" value={selectedOperatorUserId} />
                  <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{currentUser.username}</div>
                    <div className="mt-1 text-xs text-gray-500">{currentUser.account}</div>
                  </div>
                </>
              ) : (
                <select
                  name="operatorUserId"
                  value={selectedOperatorUserId}
                  onChange={(event) => setSelectedOperatorUserId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">请选择操作人员</option>
                  {operatorOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.username} / {getUserRoleLabel(option.role)} / {option.account}
                      {option.status === "DISABLED" ? " / 已禁用" : ""}
                      {!option.driverProfileId ? " / 未绑定司机" : ""}
                    </option>
                  ))}
                </select>
              )}
              <FieldError error={state.errors?.operatorUserId?.[0]} />
              {isAdminSelfOperator ? (
                <p className="mt-1 text-xs text-gray-500">
                  绠＄悊鍛樻柊寤烘垨缂栬緫杩愬崟鏃讹紝鎿嶄綔浜哄憳榛樿涓哄綋鍓嶇櫥褰曡处鍙枫€?
                </p>
              ) : driverMissingBinding ? (
                <p className="mt-1 text-xs text-amber-700">
                  请先去用户管理里给该司机账号绑定司机资料，再回来保存运单。
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">运单状态</label>
              <select
                name="status"
                defaultValue={initialData?.status ?? "DRAFT"}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {LOAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError error={state.errors?.status?.[0]} />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">备注</label>
            <textarea
              name="remark"
              rows={4}
              defaultValue={initialData?.remark ?? ""}
              placeholder="选填，可补充派单说明、客户要求等信息"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError error={state.errors?.remark?.[0]} />
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">运单号</p>
            <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {initialData?.loadNumber ?? "提交后自动生成"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">当前公司</p>
            <div className="mt-2 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-600">
              {selectedCompany ? (
                <>
                  <div className="font-medium text-gray-900">{selectedCompany.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedCompany.socialCreditCode}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {selectedCompany.contactName} / {selectedCompany.contactPhone}
                  </div>
                </>
              ) : (
                <span className="text-gray-400">请选择公司</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">费用速览</p>
            <div className="mt-2 space-y-2 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-600">
              <div className="flex items-center justify-between gap-3">
                <span>运费</span>
                <span className="font-medium text-gray-900">{formatLoadAmount(totalFeeValue)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>支出合计</span>
                <span className="font-medium text-gray-900">{formatLoadAmount(expenseTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>预计结余</span>
                <span
                  className={`font-medium ${
                    balanceFeeValue < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {formatLoadAmount(balanceFeeValue)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">提箱时间</p>
            <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {pickupAtPreview}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">修改时间</p>
            <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {initialData?.updatedAtLabel ?? "保存后生成"}
            </p>
          </div>

          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            提箱时间会用于运单列表展示、详情查看和日期筛选，请按实际提箱时刻填写到秒。
          </p>
        </aside>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={backHref}
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          返回列表
        </Link>
        <FormSubmitButton
          label={isEditing ? "保存运单" : "新建运单"}
          pendingLabel={isEditing ? "保存中..." : "提交中..."}
        />
      </div>
    </form>
  )
}
