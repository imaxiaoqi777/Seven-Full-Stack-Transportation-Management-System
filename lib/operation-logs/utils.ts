import { OperationAction, OperationModule } from "@prisma/client"

export const OPERATION_LOG_PAGE_SIZE = 15

export function getOperationActionLabel(action: OperationAction) {
  switch (action) {
    case OperationAction.CREATE:
      return "新增"
    case OperationAction.UPDATE:
      return "编辑"
    case OperationAction.DELETE:
      return "删除"
    case OperationAction.RESET_PASSWORD:
      return "重置密码"
    default:
      return action
  }
}

export function getOperationActionColor(action: OperationAction) {
  switch (action) {
    case OperationAction.CREATE:
      return "bg-emerald-100 text-emerald-700"
    case OperationAction.UPDATE:
      return "bg-blue-100 text-blue-700"
    case OperationAction.DELETE:
      return "bg-rose-100 text-rose-700"
    case OperationAction.RESET_PASSWORD:
      return "bg-amber-100 text-amber-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export function getOperationModuleLabel(module: OperationModule) {
  switch (module) {
    case OperationModule.USER_MANAGEMENT:
      return "用户管理"
    case OperationModule.LOAD_MANAGEMENT:
      return "运单管理"
    case OperationModule.CONTAINER_TYPE_MANAGEMENT:
      return "箱型管理"
    case OperationModule.COMPANY_MANAGEMENT:
      return "公司管理"
    case OperationModule.VEHICLE_MANAGEMENT:
      return "车牌管理"
    case OperationModule.DRIVER_MANAGEMENT:
      return "司机管理"
    case OperationModule.DROP_LOCATION_MANAGEMENT:
      return "落箱地点管理"
    case OperationModule.DATABASE_BACKUP:
      return "数据库备份"
    default:
      return module
  }
}

export function getOperationActionMatches(keyword: string) {
  const normalized = keyword.trim().toLowerCase()
  const matches: OperationAction[] = []

  if (["新增", "创建", "create", "add"].some((item) => normalized.includes(item))) {
    matches.push(OperationAction.CREATE)
  }

  if (["编辑", "修改", "更新", "update", "edit"].some((item) => normalized.includes(item))) {
    matches.push(OperationAction.UPDATE)
  }

  if (["删除", "delete", "remove"].some((item) => normalized.includes(item))) {
    matches.push(OperationAction.DELETE)
  }

  if (["重置密码", "密码", "reset", "password"].some((item) => normalized.includes(item))) {
    matches.push(OperationAction.RESET_PASSWORD)
  }

  return matches
}

export function getOperationModuleMatches(keyword: string) {
  const normalized = keyword.trim().toLowerCase()
  const matches: OperationModule[] = []

  if (["用户", "账号", "user"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.USER_MANAGEMENT)
  }

  if (["运单", "业务单", "load", "order"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.LOAD_MANAGEMENT)
  }

  if (["箱型", "container"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.CONTAINER_TYPE_MANAGEMENT)
  }

  if (["公司", "客户", "委托方", "company"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.COMPANY_MANAGEMENT)
  }

  if (["车牌", "车辆", "vehicle", "plate"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.VEHICLE_MANAGEMENT)
  }

  if (["司机", "driver"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.DRIVER_MANAGEMENT)
  }

  if (["落箱", "地点", "address", "location"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.DROP_LOCATION_MANAGEMENT)
  }

  if (["备份", "数据库", "dump", "sql", "backup"].some((item) => normalized.includes(item))) {
    matches.push(OperationModule.DATABASE_BACKUP)
  }

  return matches
}
