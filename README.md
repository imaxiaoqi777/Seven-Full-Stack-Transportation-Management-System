# 集装箱运输管理系统

这是一个基于 [Next.js](https://nextjs.org) 构建的集装箱运输管理项目，提供登录、仪表盘和运输业务模块的基础骨架。

## 快速开始

先启动开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

项目主要目录说明：

- `app/`：路由页面与布局
- `components/`：界面组件
- `lib/`：认证、权限和通用逻辑
- `prisma/`：数据库模型与种子数据
- `scripts/`：数据库初始化与测试脚本

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## 相关资料

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth 文档](https://next-auth.js.org/)

## 部署

可使用 `npm run build` 构建生产版本，再按你的部署环境启动 `next start`。如果需要接入云平台，也可以按平台要求配置环境变量后部署。

如需更多细节，可参考 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)。
