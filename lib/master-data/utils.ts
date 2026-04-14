import { CHINA_REGIONS } from "./china-regions"
import { DEFAULT_NOTICE_MESSAGES, MASTER_DATA_PAGE_SIZE } from "./constants"
import type {
  MasterDataPageSearchParams,
  ResolvedMasterDataParams,
} from "./types"

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export async function resolveMasterDataParams(
  searchParams: MasterDataPageSearchParams
): Promise<ResolvedMasterDataParams> {
  const resolved = await searchParams
  const pageValue = Number.parseInt(firstValue(resolved.page) ?? "1", 10)

  return {
    keyword: (firstValue(resolved.keyword) ?? "").trim(),
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    notice: firstValue(resolved.notice),
  }
}

export function getPagination(page: number) {
  const currentPage = Math.max(page, 1)

  return {
    page: currentPage,
    take: MASTER_DATA_PAGE_SIZE,
    skip: (currentPage - 1) * MASTER_DATA_PAGE_SIZE,
  }
}

export function emptyToUndefined(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export function normalizePlateNumber(value: string) {
  return value.replace(/\s+/g, "").toUpperCase()
}

export function normalizeSocialCreditCode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase()
}

export function buildFullAddress(
  province: string,
  city: string,
  district: string,
  detailAddress: string
) {
  const regionParts = [province, city, district].filter(Boolean).filter((item, index, values) => {
    return index === 0 || item !== values[index - 1]
  })

  return [...regionParts, detailAddress].filter(Boolean).join("")
}

export function parseRegionAddress(fullAddress?: string | null) {
  const normalizedAddress = fullAddress?.trim() ?? ""

  if (!normalizedAddress) {
    return {
      province: "",
      city: "",
      district: "",
      detailAddress: "",
    }
  }

  for (const provinceItem of CHINA_REGIONS) {
    if (!normalizedAddress.startsWith(provinceItem.name)) {
      continue
    }

    const restAfterProvince = normalizedAddress.slice(provinceItem.name.length)

    for (const cityItem of provinceItem.cities) {
      const usesExplicitCity = restAfterProvince.startsWith(cityItem.name)
      const canOmitCity = cityItem.name === provinceItem.name

      if (!usesExplicitCity && !canOmitCity) {
        continue
      }

      const restAfterCity = usesExplicitCity
        ? restAfterProvince.slice(cityItem.name.length)
        : restAfterProvince
      const explicitDistrict = cityItem.districts.find((item) => restAfterCity.startsWith(item))
      const omittedDuplicateDistrict =
        !explicitDistrict &&
        cityItem.districts.length === 1 &&
        cityItem.districts[0] === cityItem.name
          ? cityItem.name
          : ""
      const district = explicitDistrict ?? omittedDuplicateDistrict

      return {
        province: provinceItem.name,
        city: cityItem.name,
        district,
        detailAddress: explicitDistrict ? restAfterCity.slice(explicitDistrict.length) : restAfterCity,
      }
    }

    return {
      province: provinceItem.name,
      city: "",
      district: "",
      detailAddress: restAfterProvince,
    }
  }

  return {
    province: "",
    city: "",
    district: "",
    detailAddress: normalizedAddress,
  }
}

export function buildListPath(
  pathname: string,
  params: Record<string, string | number | Array<string | number> | undefined>
) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== "")
        .forEach((item) => searchParams.append(key, String(item)))
      return
    }

    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function getNoticeMessage(notice?: string) {
  if (!notice) {
    return null
  }

  return DEFAULT_NOTICE_MESSAGES[notice] ?? null
}
