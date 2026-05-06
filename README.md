# 纸片剪贴板

一个轻量、私人的临时文本中转站。它**不是**一个自动剪贴板同步工具：你需要在一台设备上手动粘贴文本并保存，然后在另一台设备上手动复制。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- next-themes（深浅色切换）
- SWR（客户端数据获取）
- SQLite（通过 `better-sqlite3` 持久化）

## 环境变量

参见 `.env.example`：

```env
APP_PASSWORD_HASH=$2b$10$***************************
SESSION_SECRET=change-me-to-a-long-random-string
DATABASE_PATH=.data/clipboard.sqlite3
APP_ORIGIN=http://localhost:3000
ENABLE_THIRD_PARTY_IFRAME_COOKIES=false
```

- `APP_PASSWORD_HASH`：登录密码（共享密码）的 bcrypt hash。**生产环境必须设置**，不要保存明文密码。
  开发环境如未设置，会回退到明确标注的开发密码，**不要在生产环境使用**。
- `SESSION_SECRET`：用来签名会话 cookie 的随机字符串。**生产环境必须设置**，建议至少 32 位随机字符。
- `DATABASE_PATH`：SQLite 数据库文件路径。默认是 `.data/clipboard.sqlite3`。
  - 不要放在 `public/`、`.next/`、`app/`、`out/`、`build/` 等静态、源码或构建目录中。
  - `.data/` 和常见 SQLite 数据库文件已加入 `.gitignore`。
  - 生产环境建议配置到持久化磁盘路径，例如平台提供的 volume/mount 路径。
- `APP_ORIGIN`：用于 CSRF Origin 校验的站点源，例如 `https://clipboard.example.com`。
  - 生产环境建议显式设置。
  - 未设置时，会使用请求自身 origin 做保守校验。
- `ENABLE_THIRD_PARTY_IFRAME_COOKIES`：仅当你明确需要第三方 iframe 场景时设为 `true`。
  - 默认会话 cookie 使用 `SameSite=Lax`。
  - 设为 `true` 后会使用 `SameSite=None`、`Secure` 和 `partitioned`。

## 数据持久化

当前版本已经使用 SQLite 持久化，入口在 `lib/clipboard-store.ts`，数据库初始化在 `lib/db.ts`。

- `db/schema.sql` 是数据 schema 的**唯一真实来源**，应用启动时会自动执行建表语句。
- 所有数据库读写都通过参数化 SQL 查询执行。
- 删除分组时，不删除条目，只会把相关条目的 `group_id` 置空。
- 删除标签时，不删除条目，只会删除 `clipboard_item_tags` 中的关联关系。
- 生产环境不会自动插入 mock/seed 数据。

## 安全说明

- 登录接口带有轻量防爆破保护：按 IP 记录失败次数，错误密码会有短暂延迟。
- 写操作 API 会校验 `Origin` 与 `Sec-Fetch-Site`，拒绝跨站请求。
- items/groups/tags API 除了保留 `middleware.ts` 保护外，route handler 内部也会显式鉴权。
- API 错误返回通用业务错误，不会向前端返回 SQL 原始错误、数据库路径、cookie、session token 或密码。
- 不要在日志、Issue、截图或部署平台配置中暴露原始密码、cookie、session token 或数据库文件。

## 主要功能

- 共享密码登录、登出
- 创建 / 编辑 / 删除条目（标题可选、正文必填、可选分组、可选标签、可选排序值）
- 一键复制条目正文
- 按分组、按标签筛选
- 标题与正文的客户端搜索
- 分组和标签的轻量管理（增删改、排序）
- 浅色 / 深色主题切换

## 开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 <http://localhost:3000>，使用 `APP_PASSWORD_HASH` 对应的原始密码登录。

如果使用 pnpm 10，`better-sqlite3` 需要 native binding。项目已在 `package.json` 中允许构建该依赖；如果本地出现找不到 `better_sqlite3.node` 的错误，可以执行：

```bash
pnpm rebuild better-sqlite3
```

## 生成 bcrypt hash

先安装依赖，然后用下面的命令为你的登录密码生成 bcrypt hash：

```bash
pnpm install
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash(process.argv[1], 12).then(console.log)" "your-strong-password"
```

把输出结果填入 `.env.local` 或生产环境变量：

```env
APP_PASSWORD_HASH=粘贴上一步生成的 bcrypt hash
```

不要把原始密码或 `.env.local` 提交到 Git。

## 构建检查

```bash
pnpm exec tsc --noEmit
pnpm build
```