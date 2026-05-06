# 纸片剪贴板

一个轻量、私人的临时文本中转站。它**不是**一个自动剪贴板同步工具：你需要在一台设备上手动粘贴文本并保存，然后在另一台设备上手动复制。

设计上准备部署在 VPS 上，前面挂 Cloudflare Tunnel 与 Cloudflare Access；应用本身仍然有一层共享密码登录作为兜底。

## 技术栈

- Next.js App Router (Next.js 16)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- next-themes（深浅色切换）
- SWR（客户端数据获取）

## 环境变量

参见 `.env.example`：

```env
APP_PASSWORD_HASH=$2b$10$***************************
SESSION_SECRET=change-me-to-a-long-random-string
DATABASE_PATH=.data/clipboard.dev.db
```

- `APP_PASSWORD_HASH`：登录密码（共享密码）的 bcrypt hash。**生产环境必须设置**，不要保存明文密码。
  开发环境如未设置，会回退到明确标注的 `dev-password`，**不要在生产环境使用**。
- `SESSION_SECRET`：用来签名会话 cookie 的随机字符串。建议至少 32 位随机字符。
- `DATABASE_PATH`：未来 SQLite 数据库的存储位置。当前 v0 预览版本是内存存储，未使用此项。

## 数据持久化

当前版本使用 `lib/clipboard-store.ts` 中的内存存储，重启后数据会丢失。

- `db/schema.sql` 是数据 schema 的**唯一真实来源**。
- 未来上线时，可以把 `lib/clipboard-store.ts` 替换为基于 SQLite 的实现，UI 与 API 路由无需改动。
- 本地数据库默认放在 `.data/clipboard.dev.db`，生产环境可以通过 `DATABASE_PATH` 自定义。
- `.data/` 已加入 `.gitignore`。

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

打开 <http://localhost:3000>，使用 `APP_PASSWORD_HASH` 对应的原始密码登录。示例 `.env.example` 中的 hash 对应密码是 `change-me`，请在实际部署前替换。

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
