# my-hub 开发文档

> 面向未来的开发会话（含无记忆系统的 AI）：本文档自足，读完即可接手开发。
> 最后更新：2026-08-24 —— 同步修：entries.section 分栏入契约/类型/种子、KaTeX 公式渲染落地、文档对齐实况。

---

## 1. 产品定位与信息架构

### 1.1 定位

站主（arcane orion）的个人主站与对外总入口，定位是「价值矩阵的中心」：文章、在线产品、账号都从这里出发被外部世界理解。**不是纯博客**——博客只是其中一个内部入口。

站主原话级要求：
- 「个人的作品入口，不会什么都说」（发布是有选择的）
- 「每一个子服务站点都平行，和博客同级别」
- 「主站很多入口可以做成动态动画展示」
- 「简单明了，高级有层次……排版舒服一些」「不喜欢老套的排版」

### 1.2 站点地图

```
/                     首页 = 导航枢纽
│                      ├ 身份块（我是谁 / 在做什么 / 座右铭）
│                      ├ 入口卡片区（Bento 不等宽网格，数据驱动）
│                      └ 精选文章区（手动标记 featured 的 3~4 篇）
├── /posts            博客列表全貌（标签筛选、倒序）
│    └── /posts/[slug] 文章详情（Markdown + KaTeX 数学公式）
├── /s/[id]           服务详情落地页（每个子服务一张）
│                      页内「访问 ↗」外链到真实站点
├── /rss.xml          RSS 订阅
├── /sitemap.xml      站点地图
└── ⚿ 私域占位        v1 仅占位，不做实现
```

### 1.3 入口的两种类型

| 类型 | 行为 | 例子 |
|---|---|---|
| internal | 跳转站内页面 | 文章 → `/posts` |
| service | 跳转站内详情页 `/s/[id]`，详情页内再放外链 | fit-log、rss-digest、arena |
| external | 直接外链 | GitHub |

未来新增入口 = 数据库 `entries` 表插入一行，前端自动渲染。**这是全站最重要的可扩展机制。**

---

## 2. 技术栈与架构决策

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Astro 5 + TypeScript strict | 内容站 SEO 好、静态优先性能佳；岛屿架构按需水合 |
| 样式 | Tailwind CSS v4 + CSS 设计令牌（`styles/tokens.css`） | 工具类快速迭代；令牌保证主题一致性 |
| 数据后端 | Supabase（托管云） | PostgREST 自动生成带 OpenAPI 文档的 REST API；Auth/Storage 现成，为未来私域预留；v1 零后端代码 |
| 分发 | @astrojs/rss + @astrojs/sitemap + og-image | RSS 订阅、搜索引擎收录、社交分享卡片，见 §6.5 |
| 正文渲染 | markdown-it + KaTeX（构建期） | 文章与服务详情在构建时渲染成静态 HTML，公式零客户端 JS 开销 |
| 契约 | contract-first：`specs/openapi.yaml` 为接口唯一事实源 | 前端只依赖生成的类型，不依赖后端实现细节；后端可整体更换而不伤前端 |
| 渲染策略 | SSG（构建时从 Supabase 拉数据）+ CF Pages 部署钩子 | SEO 与性能最优；内容变更后触发重新部署即可（v1 手动触发可接受） |
| 部署 | Cloudflare Pages，域名 `hub.alice001.top`（DNS 已在 CF） | 免费层足够；推送 git 自动部署 |

**渲染策略备注**：若未来出现「发布后必须秒级可见」的需求，再评估 SSR adapter 或增量渲染。当前不做。

**前后端关系图**：

```
浏览器 ──> hub.alice001.top (CF Pages: Astro 静态产物)
                │ 构建时 & 客户端按需
                ▼
        xxxx.supabase.co (PostgREST REST API, 自带 OpenAPI 文档)
                │
                ▼
        Postgres: posts / entries / profile 表
```

---

## 3. 数据模型（v1）

Supabase Postgres 表结构，DDL 版本化在 `supabase/schema.sql`。

```sql
-- 主站入口卡（博客本身也是一条 entry）
create table entries (
  id          text primary key,          -- slug，如 'posts' / 'fit-log'
  kind        text not null check (kind in ('internal','service','external')),
  title       text not null,
  tagline     text,                      -- 一句话介绍
  icon        text,                      -- 图标标识符，占位
  accent      text,                      -- 卡片点缀色，可为空
  size_hint   text default 'md',         -- bento 尺寸建议: sm|md|lg
  sort        int  not null default 100,
  visible     bool not null default true,
  section     text not null default 'works',   -- 首页分栏 blog|works|services（migration-002 引入）
  -- service 类型专用字段
  landing_description_md text,           -- /s/[id] 详情页正文（Markdown）
  status      text check (status in ('running','building','archived')),
  external_url text,
  created_at  timestamptz default now()
);

-- 博客文章
create table posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  summary     text not null,
  content_md  text not null,             -- Markdown 全文（KaTeX 用 $...$ / $$...$$）
  tags        text[] not null default '{}',
  featured    bool not null default false,   -- 手动标记精选
  visibility  text not null default 'public'
              check (visibility in ('public','unlisted','members')),
  published_at timestamptz not null,
  updated_at  timestamptz default now()
);
-- v1 只实现 public；unlisted/members 是为私域预占的契约位

-- 身份块（单行表）
create table profile (
  id     int primary key default 1 check (id = 1),
  name   text not null,
  intro  text not null,                  -- 一两句话介绍
  motto  text not null                   -- 没有结构，就没有理解。
);
```

**DDL 演进**：`supabase/schema.sql` 始终保持全量最新结构；增量变更另存 `supabase/migration-NNN-*.sql`（例：`migration-002-section.sql` 为 entries 增加 section 分栏），在 Supabase Studio SQL Editor 中执行。种子数据改 `scripts/seed-data.mjs` 后运行 `node scripts/gen-sql.mjs` 重新生成 `supabase/seed.sql`（幂等 upsert）。

**读取规则**：前端任何查询必须带 `visible = true` / `visibility = 'public'` 过滤（unlisted/members 由未来私域会话处理）。

## 4. API 契约（contract-first）

- `specs/openapi.yaml`：描述本站实际依赖的接口形状（posts / entries / profile 三组资源的查询），是**前端唯一允许依赖的接口事实源**
- Supabase PostgREST 本身在 `/rest/v1` 提供完整 OpenAPI 文档（超集）；我们的 yaml 是其中「被承诺稳定」的子集
- 类型生成：`npx openapi-typescript specs/openapi.yaml -o src/lib/api.types.ts`
- **变更纪律**：改接口形状 = 先改 openapi.yaml → 重新生成类型 → 再改代码。禁止在代码里裸写响应类型

后端尚未就绪时的本地开发：用 Prism mock（`prism mock specs/openapi.yaml -p 4000`），或在 M1 阶段直接使用 `src/lib/mock-data.ts`。

## 5. 代码模块规范（结构化的硬边界）

```
my-hub/
├── specs/openapi.yaml          # API 契约（事实源）
├── supabase/
│   ├── schema.sql              # 全量表结构 DDL（保持最新）
│   ├── migration-002-section.sql  # 增量迁移示例：entries.section 分栏
│   └── seed.sql                # 幂等种子（由 scripts/gen-sql.mjs 生成，勿手改）
├── scripts/
│   ├── seed-data.mjs           # 种子数据装配：entries/profile 定义 + 解析 content/*.md
│   ├── gen-sql.mjs             # seed-data.mjs → supabase/seed.sql
│   ├── og.mjs                  # public/og.svg → og-image.png 分享图
│   └── content/*.md            # 旧博客文章源（frontmatter + Markdown）
├── docs/                       # 本文档目录
└── src/
    ├── styles/tokens.css       # 设计令牌：颜色/字号/间距/圆角/阴影/动效时长（唯一定义处）
    ├── lib/
    │   ├── config.ts           # 站点常量（域名、标题等）
    │   ├── supabase.ts         # 客户端单例（全项目唯一 import '@supabase/supabase-js' 的地方之一）
    │   ├── api/
    │   │   ├── posts.ts        # getPosts() getFeaturedPosts() getPostBySlug()
    │   │   ├── entries.ts      # getEntries()
    │   │   └── profile.ts      # getProfile()
    │   └── mock-data.ts        # M1 原型用假数据（M2 后保留用于离线开发）
    ├── components/             # 纯展示组件，不直接访问数据库
    │   ├── EntryCard.astro     # 入口卡（bento 单元格）
    │   ├── PostCard.astro
    │   ├── ProfileBlock.astro
    │   ├── StatusBadge.astro   # 服务状态点（运行中/构建中/已归档）
    │   └── SectionHeader.astro
    ├── layouts/Base.astro      # <head>/字体/全局样式/页脚
    └── pages/
        ├── index.astro         # 首页 hub
        ├── posts/index.astro
        ├── posts/[slug].astro  # Markdown 渲染 + KaTeX
        ├── s/[id].astro        # 服务详情落地页
        └── rss.xml.ts
```

**模块化铁律**：
1. `.astro` 组件和页面**禁止**直接调用 supabase-js —— 一律经 `lib/api/*` 函数。数据获取点集中，换后端只改一层
2. 设计值（颜色/圆角/阴影/时长）**禁止**内联魔法数 —— 必须引用 tokens.css 变量
3. 组件保持纯展示（props 进、DOM 出）；数据拼装发生在 page 或 lib 层
4. 新功能先问「这属于哪个既有模块」，都不属于才新建文件

## 6. 设计系统

### 6.1 设计令牌草案（tokens.css 初始值，可调）

```css
:root {
  /* 暖白色调 */
  --bg: #FAF7F2;            /* 页面底 */
  --surface: #FFFFFF;        /* 卡片面 */
  --ink: #1C1917;            /* 正文近黑 */
  --ink-muted: #78716C;      /* 次要文字 */
  --line: #E7E0D8;           /* 分隔线 */
  --accent: TBD;             /* 强调色待站主定，暂用 #B45309 (暖棕橙) 占位 */

  --radius-card: 16px;
  --radius-sm: 10px;
  --shadow-rest: 0 1px 2px rgb(28 25 23 / .05), 0 4px 12px rgb(28 25 23 / .06);
  --shadow-hover: 0 2px 4px rgb(28 25 23 / .06), 0 12px 28px rgb(28 25 23 / .10);

  --dur-fast: 150ms;  --dur-move: 240ms;  --ease-out: cubic-bezier(.22,.61,.36,1);
}
```

### 6.2 排版

- 中文正文 15–17px，行高 1.8；标题正常字号梯度（不要超大字实验）
- 字体栈：中文 `"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`；等宽 `"JetBrains Mono", Consolas, monospace`（仅用于状态、meta 小字）。不引外部大字体包，系统栈优先
- 文章详情：行长约 68ch，KaTeX 公式渲染保留

### 6.3 动效清单（克制，全部 ≤250ms）

| 场景 | 效果 |
|---|---|
| 首屏进入 | 卡片错峰淡入上移（stagger 60ms） |
| 卡片 hover | 浮起 4px + shadow 从 rest 到 hover |
| 状态点 ●运行中 | 2.5s 缓慢呼吸（opacity 脉冲） |
| 座右铭区 | 极轻暖色光斑缓慢漂移（20s 循环，opacity < 0.5） |
| 页面切换 | 浏览器原生 + Astro View Transitions 淡入 |

禁止：视差滚动、大型粒子、入场长动画。原则：动效提示可交互性，不表演。

### 6.4 文案规范（站主明确要求）

朴素直白，禁用修辞堆砌与「中二」命名。导航与区块名只用功能词：文章 / 作品相关服务用产品本名 / 订阅 / 关于。不用「网络出口」「结构之印」这类词。

---

### 6.5 分发三件套

| 文件 | 作用 | 维护方式 |
|---|---|---|
| `src/pages/rss.xml.ts` | RSS 订阅源 `/rss.xml`，数据来自 lib/api/posts | 自动，无需维护 |
| astro.config 的 `sitemap()` 集成 | 生成 `/sitemap-index.xml` 供搜索引擎收录；`public/robots.txt` 已指向它 | 自动 |
| `public/og-image.png` (1200×630) | 社交分享卡片大图；meta 标签在 Base.astro | 改 `public/og.svg` 后执行 `node scripts/og.mjs` 重新生成 PNG 并提交 |

## 7. 内容管理（后台）

- **v1 后台 = Supabase Studio**（supabase.com 登录后的表格编辑器）：写文章、标 featured、调入口排序都在这里，零开发
- 写作流：Studio 里编辑 `posts.content_md`（Markdown）→ 触发 CF Pages 重新部署（v1 手动点 Deploy Hook，远期做自动 webhook）
- **站内 admin 页是远期项**，等真实使用痛点出现再做（登录用 Supabase Auth）

## 8. 部署（CF Pages）

1. CF Dashboard → Workers & Pages → 连接 git 仓库
2. 构建命令 `npm run build`，输出目录 `dist`
3. 环境变量配置 `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`（Astro 要求 PUBLIC_ 前缀才进构建期）
4. Custom domain 绑 `hub.alice001.top`（DNS 已在同账号 CF，自动加 CNAME）
5. 创建 Deploy Hook，供内容更新后触发重建

**内容变更后的上线流程**：Studio 改数据 → 触发 Deploy Hook（或任意 git push）→ 构建时重新拉取 Supabase 数据 → 约 1 分钟生效。

## 9. 里程碑与验收

见 README.md 路线图表。每个里程碑完成时**必须同步更新本文档与 README**（见 AGENTS.md 硬规则）。

## 10. 已知未决项

- [ ] 强调色（accent）：站主未定，当前占位 `#B45309`
- [x] 旧博客迁移已完成：4 篇经 scripts/seed-data.mjs → seed.sql 导入（新文章直接在 Studio 写）
- [ ] 是否未来把主站升级到 apex 域名 alice001.top（当前按 blog 子域建设，不影响架构）
