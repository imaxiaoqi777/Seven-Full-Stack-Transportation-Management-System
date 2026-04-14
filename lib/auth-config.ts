import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { RecordStatus, Role } from "@prisma/client"

import { verifyPassword } from "./auth"
import { prisma } from "./db"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      status: RecordStatus
      account: string
      username: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: Role
    status: RecordStatus
    account: string
    username: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "账号密码",
      credentials: {
        account: {
          label: "账号",
          type: "text",
          placeholder: "请输入账号",
        },
        password: {
          label: "密码",
          type: "password",
          placeholder: "请输入密码",
        },
      },
      async authorize(credentials) {
        const account = credentials?.account?.toString().trim()
        const password = credentials?.password?.toString()

        if (!account || !password) {
          throw new Error("请输入账号和密码。")
        }

        const user = await prisma.user.findUnique({
          where: { account },
        })

        if (!user) {
          throw new Error("账号不存在。")
        }

        if (user.status === "DISABLED") {
          throw new Error("该账号已被禁用，无法登录。")
        }

        const isPasswordValid = await verifyPassword(password, user.password)

        if (!isPasswordValid) {
          throw new Error("密码错误。")
        }

        return {
          id: user.id,
          name: user.username,
          email: user.account,
          role: user.role,
          status: user.status,
          account: user.account,
          username: user.username,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (!session.user || !token.id) {
        return session
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: {
          id: true,
          username: true,
          account: true,
          role: true,
          status: true,
        },
      })

      if (!currentUser) {
        session.user.id = ""
        session.user.role = "DRIVER"
        session.user.status = "DISABLED"
        session.user.account = ""
        session.user.username = ""
        session.user.name = null
        session.user.email = null
        return session
      }

      session.user.id = currentUser.id
      session.user.role = currentUser.role
      session.user.status = currentUser.status
      session.user.account = currentUser.account
      session.user.username = currentUser.username
      session.user.name = currentUser.username
      session.user.email = currentUser.account

      return session
    },
  },
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "development-secret-change-me",
}

export function auth() {
  return getServerSession(authOptions)
}

