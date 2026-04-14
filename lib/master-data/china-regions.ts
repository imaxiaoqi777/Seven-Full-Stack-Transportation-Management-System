import rawChinaAreaDataJson from "china-area-data/data.json"

export type ChinaRegion = {
  name: string
  cities: Array<{
    name: string
    districts: string[]
  }>
}

type RawChinaAreaData = Record<string, Record<string, string>>

const rawChinaAreaData = rawChinaAreaDataJson as RawChinaAreaData

const ROOT_REGION_CODE = "86"
const DIRECT_CONTROLLED_PROVINCE_CODES = new Set(["110000", "120000", "310000", "500000"])
const DIRECT_DISTRICT_PROVINCE_CODES = new Set(["810000", "820000"])
const SYNTHETIC_CITY_GROUP_NAMES = new Set([
  "市辖区",
  "县",
  "省直辖县级行政区划",
  "自治区直辖县级行政区划",
])

function getUniqueNames(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function getNormalizedDistricts(districtMap: Record<string, string> | undefined) {
  return getUniqueNames(Object.values(districtMap ?? {}).filter((item) => item !== "市辖区"))
}

function mergeCities(cities: ChinaRegion["cities"]) {
  const cityMap = new Map<string, Set<string>>()

  for (const city of cities) {
    const districts = cityMap.get(city.name) ?? new Set<string>()

    city.districts.forEach((district) => districts.add(district))
    cityMap.set(city.name, districts)
  }

  return Array.from(cityMap.entries()).map(([name, districts]) => ({
    name,
    districts: Array.from(districts),
  }))
}

function buildProvinceCities(provinceCode: string, provinceName: string): ChinaRegion["cities"] {
  const cityMap = rawChinaAreaData[provinceCode] ?? {}

  if (DIRECT_DISTRICT_PROVINCE_CODES.has(provinceCode)) {
    return [
      {
        name: provinceName,
        districts: getNormalizedDistricts(cityMap),
      },
    ]
  }

  const cities: ChinaRegion["cities"] = []

  for (const [cityCode, rawCityName] of Object.entries(cityMap)) {
    const districts = getNormalizedDistricts(rawChinaAreaData[cityCode])

    if (DIRECT_CONTROLLED_PROVINCE_CODES.has(provinceCode)) {
      cities.push({
        name: provinceName,
        districts,
      })
      continue
    }

    if (SYNTHETIC_CITY_GROUP_NAMES.has(rawCityName)) {
      cities.push(
        ...districts.map((districtName) => ({
          name: districtName,
          districts: [districtName],
        }))
      )
      continue
    }

    cities.push({
      name: rawCityName,
      districts: districts.length > 0 ? districts : [rawCityName],
    })
  }

  return mergeCities(cities)
}

export const CHINA_REGIONS: ChinaRegion[] = Object.entries(
  rawChinaAreaData[ROOT_REGION_CODE] ?? {}
).map(([provinceCode, provinceName]) => ({
  name: provinceName,
  cities: buildProvinceCities(provinceCode, provinceName),
}))
