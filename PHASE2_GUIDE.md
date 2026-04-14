# 第二阶段：登录鉴权与权限控制 - 完成指南

## 📋 实现概览

本阶段已完成以下功能：

### 1. ✅ 认证系统 (Auth.js)
- 基于凭据的登录（账号+密码）
- 密码加密存储（bcryptjs）
- 会话管理
- 登录/注销功能

### 2. ✅ 权限控制系统
- 两个角色：ADMIN（管理员）和 OPERATOR（操作员）
- 权限矩阵定义
- 基于角色的访问控制（RBAC）
- 路由保护中间件

### 3. ✅ UI 组件
- 登录表单（带 React Hook Form + Zod 验证）
- 登出按钮
- 用户信息显示

---

## 🚀 设置和运行步骤

### 第一步：配置数据库连接
1. 创建 `.env.local` 文件（基于 `.env.example`）
2. 配置 `DATABASE_URL`：
   ```
   DATABASE_URL="mysql://root:你的密码@127.0.0.1:3306/container_transport"
   ```
3. 设置 `NEXTAUTH_SECRET`：
   ```
   # 可以使用 openssl 生成
   openssl rand -base64 32
   ```

### 第二步：初始化数据库
```bash
# 1. 生成 Prisma 客户端
npm run prisma:generate

# 2. 运行数据库迁移
npm run prisma:migrate

# 3. 生成种子数据（创建默认管理员账号）
npm run db:seed
```

### 第三步：启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 -> 会自动重定向到 /login

---

## 🧪 测试步骤

### 1️⃣ 测试登录功能

#### 管理员账号
```
邮箱: admin@example.com
密码: admin123
角色: 管理员 (ADMIN)
```

#### 操作员账号
```
邮箱: operator@example.com
密码: operator123
角色: 操作员 (OPERATOR)
```

#### 登录测试
1. 访问 http://localhost:3000/login
2. 输入管理员账号和密码
3. 点击"登录"按钮
4. ✅ 应该跳转到 /dashboard 仪表盘页面

### 2️⃣ 测试权限控制

#### 管理员权限测试（使用 admin@example.com 登录）
- ✅ 可以访问 /dashboard
- ✅ 可以访问 /dashboard/users（用户管理）
- ✅ 可以访问 /dashboard/container-types（箱型管理）
- ✅ 可以访问 /dashboard/vehicles（车辆管理）
- ✅ 可以访问 /dashboard/drivers（司机管理）
- ✅ 可以访问 /dashboard/drop-locations（落地点管理）
- ✅ 可以访问 /dashboard/loads（业务单管理）

#### 操作员权限测试（使用 operator@example.com 登录）
- ✅ 可以访问 /dashboard
- ✅ 可以访问 /dashboard/loads（业务单管理）
- ❌ 不能访问 /dashboard/users（重定向到 /dashboard）
- ❌ 不能访问 /dashboard/container-types（重定向到 /dashboard）
- ❌ 不能访问 /dashboard/vehicles（重定向到 /dashboard）
- ❌ 不能访问 /dashboard/drivers（重定向到 /dashboard）
- ❌ 不能访问 /dashboard/drop-locations（重定向到 /dashboard）

### 3️⃣ 测试路由保护

1. **未登录访问受保护路由**
   - 访问 http://localhost:3000/dashboard
   - ✅ 应该被重定向到 /login

2. **已登录访问登录页**
   - 登录后访问 http://localhost:3000/login
   - ✅ 应该被重定向到 /dashboard

3. **登出功能**
   - 在 dashboard 顶部导航栏点击"退出登录"
   - ✅ 应该跳转到 /login
   - ✅ 再次访问 /dashboard 应该被重定向到 /login

### 4️⃣ 测试登录表单验证

1. **邮箱验证**
   - 输入空邮箱 -> ❌ 显示"邮箱不能为空"
   - 输入非邮箱格式 -> ❌ 显示"邮箱格式不正确"
   - 输入有效邮箱 -> ✅ 通过

2. **密码验证**
   - 输入空密码 -> ❌ 显示"密码不能为空"
   - 输入少于6字符的密码 -> ❌ 显示"密码至少6个字符"
   - 输入有效密码 -> ✅ 通过

3. **错误处理**
   - 输入正确格式但错误的邮箱和密码 -> ✅ 显示"用户不存在" 或 "密码错误"
   - 输入已禁用的账户邮箱 -> ✅ 显示"账户已被停用"

### 5️⃣ 测试用户信息显示

1. 登录后，查看导航栏右上角
2. ✅ 显示用户首字母头像
3. ✅ 显示用户名称
4. ✅ 显示用户角色（"管理员" 或 "操作员"）

---

## 📁 文件结构

本阶段新增文件：

```
app/
├── api/auth/[...nextauth]/
│   └── route.ts              # Auth.js API 路由
├── login/
│   └── page.tsx              # 登录页面（已更新）
└── dashboard/
    └── layout.tsx            # 仪表盘布局（已更新）

lib/
├── auth.ts                   # 密码加密/验证工具
├── auth-config.ts            # Auth.js 配置
├── auth-service.ts           # 认证服务
├── permissions.ts            # 权限工具函数
└── validations/
    └── auth.ts               # 登录表单验证 Schema

components/
└── auth/
    ├── LoginForm.tsx         # 登录表单组件（新）
    └── LogoutButton.tsx      # 登出按钮组件（新）

prisma/
└── seed.ts                   # 种子数据脚本（新）

middleware.ts                 # 路由保护中间件（新）

.env.example                  # 环境变量模板（已更新）
```

---

## 🔐 安全特性

✅ **密码安全**
- 使用 bcryptjs 加密存储
- 加盐轮数：10

✅ **会话管理**
- 使用 NextAuth session tokens
- 配置了 AUTH_SECRET

✅ **路由保护**
- 中间件检查用户认证状态
- 基于角色的访问控制

✅ **表单验证**
- 客户端 Zod 验证
- 服务端身份验证

---

## 🛠️ API 参考

### 认证服务函数

```typescript
// 获取当前会话
import { getSession } from '@/lib/auth-service'
const session = await getSession()

// 获取当前用户（未登录则重定向）
import { getCurrentUser } from '@/lib/auth-service'
const user = await getCurrentUser()

// 检查是否已认证
import { isAuthenticated } from '@/lib/auth-service'
const isAuth = await isAuthenticated()

// 检查是否是管理员
import { isAdmin } from '@/lib/auth-service'
const isAdminUser = await isAdmin()

// 检查是否是操作员
import { isOperator } from '@/lib/auth-service'
const isOp = await isOperator()
```

### 权限检查函数

```typescript
import { 
  hasPermission, 
  isAdmin, 
  isOperator,
  canAccessResource,
  getUserPermissions,
  checkUserPermission 
} from '@/lib/permissions'

// 检查权限
hasPermission('ADMIN', 'users') // => true
hasPermission('OPERATOR', 'users') // => false

// 检查操作员数据所有权
canAccessResource('OPERATOR', userId, resourceCreatedBy)
```

---

## 🚨 常见问题

### Q: 登录时提示 "用户不存在"
**A:** 确保已运行 `npm run db:seed` 生成默认账户

### Q: 中间件不生效怎么办？
**A:** 
1. 检查 `middleware.ts` 文件是否在项目根目录
2. 检查 `next.config.ts` 是否正确配置
3. 重启开发服务器

### Q: 如何修改默认管理员密码？
**A:** 
1. 登录管理员账户
2. 可以通过 Prisma Studio 修改：`npm run prisma:studio`
3. 找到 User 表，手动更新（需要重新加密密码）

---

## 📝 后续工作

### 第三阶段将实现：
- [ ] 用户管理（创建子账号）
- [ ] 箱型管理
- [ ] 车牌号管理
- [ ] 司机管理
- [ ] 落箱地点管理
- [ ] 业务单管理

### 权限预留设计：
- [ ] Operator 只能查看自己创建的数据（通过 `createdBy` 字段）
- [ ] 可在查询时添加权限检查

---

## 📚 相关文档

- [Auth.js Documentation](https://authjs.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Prisma ORM](https://www.prisma.io/)
