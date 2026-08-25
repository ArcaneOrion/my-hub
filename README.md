# my-hub · arcane orion 的个人主站

> 超级个体的基地，价值矩阵的中心。部署于 `hub.alice001.top`。

## 这是什么

一个**两层结构的个人站**：外层是导航枢纽（hub），内层是各个房间。

- **入口层（首页）**：身份块 + 座右铭 + 可扩展的入口卡片区（Bento 网格）+ 精选文章
- **房间层**：
  - `/posts` —— 博客全貌（传统博客：列表 / 详情 / 标签 / RSS）
  - `/s/[id]` —— 每个子服务的详情落地页（介绍、状态），页内放「访问 ↗」外链到真实站点
  - 未来更多入口，全部由数据库数据驱动，新增入口不改代码

博客只是众多入口中唯一「内部消化」的；子服务（fit-log、rss-digest 等）都是「内部详情页 → 外链跳转」。

## 文档地图

| 文档 | 内容 |
|---|---|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 开发文档：技术栈、架构、数据模型、API 契约、模块规范、部署 |
| [AGENTS.md](AGENTS.md) | AI 编码会话入口：硬规则与速查（**改代码前先读它**） |

## 技术栈一览

Astro 5（静态优先）· TypeScript · Tailwind CSS v4 · markdown-it + KaTeX（构建期公式渲染）· Supabase（Postgres + 自动 REST API + Auth）· Cloudflare Pages 部署

## 快速开始（项目搭建后有效）

```bash
npm install
npm run dev        # 本地开发
npm run build      # 构建静态站
npm run preview    # 预览构建产物
npm run admin      # 本地管理端（可视化编辑文章/入口卡/身份块，带实时预览，仅本地）
```

环境变量 `.env`：

```
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # 公开密钥，可进前端
```

## 路线图

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M0 | 项目文档（本目录） | ✅ |
| M1 | 静态原型：主页 + 服务详情页示例 + 文章列表/详情，mock 数据，三页互通 | ✅ |
| M2 | Supabase 接入：建表 + 导入旧文与 entries/profile；lib/api 切真数据（mock 保留作离线回退）| ✅ |
| M3 | 部署 + RSS / sitemap / og-image 分发三件套 | ✅ |
| M4 | 动效打磨、响应式、私域占位入口（⚿） | 🔶 进行中（⚿ 占位与响应式基础已上线；余动效打磨收尾） |
| 远期 | 评论、新入口（lab 等）、站内登录版 admin | ⬜（本地管理端 `npm run admin` 已实现） |

## 设计基调（一句话版）

暖白色调、现代圆角卡片配轻阴影、克制的微动效、朴素直白的文案。详见 DEVELOPMENT.md 的设计系统章节。
