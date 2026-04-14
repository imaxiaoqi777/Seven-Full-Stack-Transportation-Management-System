import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { auth } from "@/lib/auth-config"
import { getLoadExportList } from "@/lib/loads/queries"
import {
  formatLoadDateTimeLabel,
  getLoadStatusLabel,
  resolveLoadListFilters,
} from "@/lib/loads/utils"
import { hasPermission } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN")
}

function buildFileName() {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("")
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("")

  return `运单导出-${datePart}-${timePart}.xlsx`
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session.user.status === "DISABLED") {
    return NextResponse.redirect(new URL("/login?notice=disabled", request.url))
  }

  if (!hasPermission(session.user.role, "loads")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const filters = resolveLoadListFilters({
    loadNumber: request.nextUrl.searchParams.get("loadNumber"),
    companyIds: request.nextUrl.searchParams.getAll("companyIds"),
    containerTypeIds: request.nextUrl.searchParams.getAll("containerTypeIds"),
    blNumber: request.nextUrl.searchParams.get("blNumber"),
    driverIds: request.nextUrl.searchParams.getAll("driverIds"),
    vehicleIds: request.nextUrl.searchParams.getAll("vehicleIds"),
    dateFrom: request.nextUrl.searchParams.get("dateFrom"),
    dateTo: request.nextUrl.searchParams.get("dateTo"),
  })

  const items = await getLoadExportList({
    filters,
    currentUserId: session.user.id,
    currentUserRole: session.user.role,
  })

  const rows = items.map((item) => ({
    提箱时间: formatLoadDateTimeLabel(item.pickupAt),
    运单号: item.loadNumber,
    公司名称: item.company?.name ?? "",
    统一社会信用代码: item.company?.socialCreditCode ?? "",
    联系人: item.company?.contactName ?? "",
    联系电话: item.company?.contactPhone ?? "",
    目的地: item.destination,
    提单号: item.blNumber,
    船名航次: item.vesselVoyage ?? "",
    箱型: item.containerType.name,
    箱号: item.containerNumber,
    封号: item.sealNumber ?? "",
    落箱地点: item.dropLocation.name,
    落箱地址: item.dropLocation.fullAddress,
    车牌号: item.vehicle.plateNumber,
    司机: item.driver.name,
    司机电话: item.driver.phone,
    操作人员: item.operatorUser.username,
    状态: getLoadStatusLabel(item.status),
    总费用: Number(item.totalFee),
    燃气费: Number(item.gasFee),
    司机工资: Number(item.driverPay),
    其他费用: Number(item.otherFee),
    其他费用说明: item.otherFeeRemark ?? "",
    结余: Number(item.balanceFee),
    创建时间: formatDateTime(item.createdAt),
    更新时间: formatDateTime(item.updatedAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "提箱时间",
      "运单号",
      "公司名称",
      "统一社会信用代码",
      "联系人",
      "联系电话",
      "目的地",
      "提单号",
      "船名航次",
      "箱型",
      "箱号",
      "封号",
      "落箱地点",
      "落箱地址",
      "车牌号",
      "司机",
      "司机电话",
      "操作人员",
      "状态",
      "总费用",
      "燃气费",
      "司机工资",
      "其他费用",
      "其他费用说明",
      "结余",
      "创建时间",
      "更新时间",
    ],
  })

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 36 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "运单列表")

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer
  const bytes = new Uint8Array(buffer)

  const fileName = buildFileName()

  return new NextResponse(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  })
}
