# Seven-

这是一个基于 Next.js 16、React 19、TypeScript 构建的单仓全栈运输管理系统，采用 App Router 组织页面与路由，在同一套代码里同时承载前端界面、服务端渲染页面、Server Action 表单提交、导出/备份接口以及数据库访问逻辑。前端界面使用 Tailwind CSS 4 构建后台管理 UI，配合 `lucide-react`、`class-variance-authority`、`clsx`、`tailwind-merge` 做组件样式组织；服务端运行在 Node.js 上，数据层通过 Prisma 5 访问 MySQL。

## 业务与数据层

系统核心数据模型围绕用户、公司、箱型、车牌、司机、落箱地点、运单、运单历史和操作日志展开，并在数据库层建立了状态、角色、索引和关联关系，适合做运输调度类后台管理。认证采用 NextAuth 的 Credentials 模式，密码校验用 `bcryptjs`，会话策略使用 JWT，但每次取会话时仍回查数据库，保证账号状态和角色权限实时生效。业务提交主要走 Server Action，导出走 Route Handler，其中 Excel 导出使用 `xlsx`，数据库备份通过 `mysql2/promise` 生成整库 SQL 逻辑备份。

## 功能模块

从菜单结构看，它是一个典型的调度后台，包含概览、运单管理、箱型管理、公司管理、车牌管理、司机管理、落箱地点、用户管理和操作日志等模块；管理员与司机账号看到的能力范围不同，属于典型的 RBAC 权限后台。

## Exe 技术

这个项目实际上有两种桌面/本地交付形态：

- Electron 桌面版：项目使用 Electron 32 作为桌面壳，主进程在启动后创建 `BrowserWindow`，再加载本地 Next 服务的 `/login` 页面。开发模式下它会直接拉起 `npm run dev`；生产模式下则在 Electron 进程内启动 Next 生产服务，再让桌面窗口访问本地端口。最终通过 `electron-builder` 打成 Windows 的 NSIS 安装包，所以真正的桌面 `exe` 技术栈是 `Electron + Next.js + Node.js + electron-builder`。
- Standalone Web 本地启动版：项目同时启用了 Next 的 `output: "standalone"`，可以生成一个脱离源码目录运行的 Node 服务包。`dist-web` 下的 `server.js` 是 Next 生成的生产服务器入口，`start-web.bat` 用 `node server.js` 启动服务，`Stop-Container-Transport.bat` 通过结束 `3000` 端口进程来停止服务。目录里的 `Start-Container-Transport.exe` 体积只有 23 KB，仓库里没有它的源码；结合体积和目录结构，它更像一个轻量 Windows 启动器，用来拉起这套 standalone Web 服务，而不是 Electron 主程序本体。

## 快速开始

先安装依赖，再启动开发服务器：

```bash
npm install
npm run dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 项目目录

- `app/`：路由页面与布局
- `components/`：界面组件
- `lib/`：认证、权限、业务逻辑和通用工具
- `prisma/`：数据库模型、迁移和种子数据
- `scripts/`：数据库初始化、测试和启动器相关脚本
- `public/`：静态资源

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run db:create
npm run db:seed
npm run desktop:dev
npm run desktop:start
npm run desktop:dist
```

## 部署说明

- Web 生产环境：执行 `npm run build` 后使用 `next start` 或 standalone 产物启动。
- Electron 桌面版：执行 `npm run desktop:dist`，通过 `electron-builder` 产出 Windows 安装包。
- 数据库：项目使用 MySQL，运行前需要配置 `DATABASE_URL` 等环境变量。

## 相关技术

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Electron](https://www.electronjs.org/)

## 页面预览

<img width="1720" height="823" alt="image" src="https://github.com/user-attachments/assets/0f323e34-fef2-4f13-a097-d4d3dd4feaa2" />
<img width="1910" height="925" alt="c3de80ce-b16c-4ee3-8156-539963e9596d" src="https://github.com/user-attachments/assets/25a109a6-3254-49f0-82df-b71463aadead" />
<img width="1910" height="925" alt="image" src="https://github.com/user-attachments/assets/ae91b58a-1f5c-4172-8a23-86a139c1d681" />
<img width="1910" height="925" alt="image" src="https://github.com/user-attachments/assets/ef09ce1c-6ad9-4929-9465-cad2519eca4b" />
<img width="1910" height="925" alt="image" src="https://github.com/user-attachments/assets/488cc2fd-2b4b-485e-9ab4-58c9a3ea1f9f" />
