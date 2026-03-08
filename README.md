# StockView - 股票投资管理平台

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind CSS-3-06b6d4)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3-3ecf8e)](https://supabase.com)

**在线访问**: [https://stockview-one.vercel.app/](https://stockview-one.vercel.app/)

</div>

## 项目简介

StockView 是一个基于 Next.js 14 构建的股票投资管理平台，帮助用户追踪和管理股票投资组合，提供实时行情分析、资产配置展示等功能。

## 技术栈

| 技术 | 说明 |
|------|------|
| Next.js 14 | React 全栈框架 (App Router) |
| TypeScript | 类型安全的 JavaScript 超集 |
| Tailwind CSS | 原子化 CSS 样式框架 |
| Supabase | 后端即服务 (Auth + Database) |
| Recharts | 数据可视化图表 |

## 功能特性

- 📊 **Dashboard 仪表盘** - 展示总资产、持仓概况、收益走势
- 📈 **个股分析** - 详细分析单只股票的走势和配置
- 📥 **数据导入** - 支持 CSV 格式导入持仓数据
- 🔐 **用户认证** - 邮箱注册登录，会话管理
- 🔄 **多窗口同步** - 多标签页退出登录自动同步
- 🛡️ **错误处理** - 全局错误捕获 + 组件级 ErrorBoundary

## 开发环境

### 前置要求

- Node.js 18+
- npm / yarn / pnpm / bun

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/Miantiaowudi/stockview.git
cd stockview

# 安装依赖
npm install
# 或
yarn install
# 或
pnpm install
```

### 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Supabase 配置 (从 Supabase 面板获取)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
stockview/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── login/          # 登录页
│   │   │   └── register/       # 注册页
│   │   ├── (dashboard)/        # 认证后页面
│   │   │   ├── dashboard/      # 主仪表盘
│   │   │   ├── stock/           # 个股分析
│   │   │   └── import/          # 数据导入
│   │   ├── auth/               # 路由守卫
│   │   └── layout.tsx          # 根布局
│   ├── components/             # React 组件
│   │   ├── AuthSyncProvider.tsx    # 多窗口登录同步
│   │   ├── ErrorBoundary.tsx        # 错误边界
│   │   └── GlobalErrorHandler.tsx  # 全局错误处理
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useAuthSync.ts      # 登录同步逻辑
│   ├── lib/                    # 工具库
│   │   └── supabase.ts        # Supabase 客户端
│   └── styles/                 # 全局样式
├── public/                     # 静态资源
├── .env.local                  # 环境变量 (本地)
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
└── package.json                # 项目依赖
```

## 部署

### Vercel 部署 (推荐)

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库 `Miantiaowudi/stockview`
3. 在 Vercel 项目设置中添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 点击 Deploy

部署完成后访问: **https://stockview-one.vercel.app/**

## 安全规范

项目遵循安全开发规范，详见 [SECURITY.md](./SECURITY.md)

- 敏感信息脱敏处理
- XSS 攻击防御
- 禁止硬编码密钥
- 正确的可选链使用

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: 添加新功能'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

MIT License

---

Built with ❤️ using Next.js + Supabase
