import { hash, compare } from 'bcryptjs'

/**
 * 密码加密
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword)
}

/**
 * 生成简单的会话令牌
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
