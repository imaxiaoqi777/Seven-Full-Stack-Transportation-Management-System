import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * 格式化日期
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 生成业务单号
 */
export function generateLoadNumber(): string {
  const prefix = 'LD'
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${year}${month}${day}${random}`
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * 验证手机号
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone)
}

/**
 * 格式化货币
 */
export function formatCurrency(value: number | null | undefined): string {
  if (!value) return '¥0.00'
  return `¥${value.toFixed(2)}`
}

/**
 * 状态标签颜色
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ENABLED: 'bg-emerald-100 text-emerald-700',
    DISABLED: 'bg-slate-200 text-slate-700',

    // Load Status
    DRAFT: 'bg-gray-100 text-gray-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',

    // Payment Status
    PAID: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    UNPAID: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * 获取状态的中文显示名称
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ENABLED: '启用',
    DISABLED: '禁用',

    // Load Status
    DRAFT: '草稿',
    ASSIGNED: '已分配',
    IN_TRANSIT: '运输中',
    DELIVERED: '已送达',
    COMPLETED: '已完成',
    CANCELLED: '已取消',

    // Payment Status
    PAID: '已支付',
    PARTIAL: '部分支付',
    UNPAID: '未支付',
  }
  return labels[status] || status
}
