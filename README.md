# Daydream-Yisu（易宿酒店）

[项目详情-飞书文档](https://boyuanclub.feishu.cn/wiki/DjCpw84gxicuUYkUMCJcxmrnnoh)

面向酒店商家与旅客的酒店信息管理与查询系统

- 用户端（`frontend/mobile`）：酒店搜索、筛选、列表、详情、周边信息、实时更新提示
- 管理端（`frontend/admin`）：商户酒店信息维护（版本化）+ 管理员审核后台
- 后端（`backend`）：NestJS + Prisma，提供业务接口、审核流、对象存储上传、实时通知等能力

## 在线演示

- 用户端 Web：https://yisu-mobile.daydreamer.net.cn/
- 管理端 Web：https://yisu-admin.daydreamer.net.cn/
- 用户端 App（Release）：https://github.com/floatDreamWithSong/ctrip-YiSu-Hotel/releases/tag/v1.2.0

## 技术栈（概要）

- Monorepo：`pnpm workspace` + `turbo`
- 前端：React 19、Vite、TanStack Router / Query、Zustand、Ant Design / Ant Design Mobile、Tailwind CSS v4
- 后端：NestJS、Prisma、PostgreSQL（+ PostGIS 插件）、Redis
- 存储与部署：Tencent COS/CDN、Docker Compose、GitHub Actions

## 项目亮点（快速了解）

- 酒店信息版本化管理：同一酒店可维护多份信息版本，支持草稿、送审、发布、撤回、下线
- 双角色管理端：商户侧编辑发布流程 + 管理员侧审核流程与审核记录追踪
- 用户端体验优化：多定位方式、筛选排序、无限滚动、虚拟列表、View Transition
- 实时更新提示：商户发布新版本后，浏览中的用户可收到更新提醒
- 前后端共享契约：`@yisu/shared` 统一类型与 schema，降低联调成本

## 仓库结构

```text
backend/             NestJS API + Prisma + Docker 配置
frontend/
  admin/             管理端（商户 + 管理员）
  mobile/            用户端（Web / 可打包 App）
packages/
  shared/            前后端共享类型、Schema、常量
  eslint-config/     ESLint 配置
  prettier-config/   Prettier 配置
  typescript-config/ TypeScript 配置
docs/                项目文档（含高德地图 API 文档）
```

## 功能概览

### 用户端（旅客）

- 酒店搜索与筛选（关键词、位置、价格、星级、标签等）
- 多定位方式（自动定位 / 搜索地址 / 城市选择）
- 列表排序（价格、星级、距离）
- 酒店详情（房型、轮播图、周边 POI、附近酒店推荐）
- 商户更新后实时提示用户刷新查看最新信息

### 管理端（商户）

- 酒店创建、编辑、删除（软删除）
- 酒店信息版本管理（复制版本、保存草稿、提交审核、撤回、下线）
- 图片压缩 + 对象存储预签名直传
- 表单校验与脏数据关闭拦截

### 管理端（管理员）

- 审核列表（待审核 / 已通过 / 已拒绝）
- 审核详情查看与通过/拒绝处理
- 审核记录查询与追踪

## 快速开始

### 1. 环境准备

- Node.js（建议使用 LTS 版本（例如22+））
- `pnpm`（仓库使用 `pnpm@10`）
- PostgreSQL（启用 PostGIS）
- Redis

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

仓库内包含各应用的 `.env` 文件（如 `backend/`、`frontend/admin/`、`frontend/mobile/`）。

### 4. 启动开发环境

```bash
pnpm dev
```

常用单应用启动：

```bash
pnpm --filter backend dev
pnpm --filter admin dev    # http://localhost:7000
pnpm --filter mobile dev   # http://localhost:7001
```

## 常用命令

```bash
# 全仓库
pnpm dev
pnpm build
pnpm lint
pnpm check

# 后端
pnpm --filter backend dev
pnpm --filter backend test
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate:dev

# 前端
pnpm --filter admin test
pnpm --filter mobile test

# 共享包
pnpm --filter @yisu/shared build
```

## 部署与联调

- 后端提供 `backend/docker-compose.yml` 用于本地多服务联调
- CI/CD 使用 GitHub Actions（构建、检查、部署）
- 移动端支持通过 Capacitor 打包（见 `frontend/mobile`）

## 贡献说明

- 提交需通过lefthook检查
