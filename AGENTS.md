# AGENTS.md — AI 编码会话须知

本文件是任何 AI 会话（无论有无外部记忆系统）在本仓库工作的入口。**改代码前先读完。**

## 项目一句话

arcane orion 的个人主站（hub + 房间两层结构），Astro + Supabase + CF Pages，部署于 `hub.alice001.top`。

## 文档地图

1. `docs/DEVELOPMENT.md` —— 开发文档：架构、数据模型、API 契约、模块规范、设计系统、部署。**动手前必读**
2. `README.md` —— 定位与路线图

## 硬规则（违反即返工）

0. **先读 DEVELOPMENT.md**：架构/契约/设计令牌/部署细节都在里面，本文件只是索引与红线
1. **文档同步**：任何架构、数据模型、设计系统的变更，必须同步更新 `docs/DEVELOPMENT.md` 对应章节。文档是唯一上下文来源，允许文档过时等于让未来会话失忆
2. **数据访问边界**：组件禁止直接调用 supabase-js，一律经 `src/lib/api/*`
3. **契约先行**：接口形状变更必须先改 `specs/openapi.yaml` 再生成类型再写代码；禁止裸写响应类型
4. **设计令牌**：颜色/圆角/阴影/动效时长必须引用 `src/styles/tokens.css`，禁止内联魔法数
5. **文案朴素**：UI 文案只用直白功能词。禁止修辞堆砌、意象化命名（站主明确反感）
6. **v1 反范围**：不做评论、搜索、站内登录版 admin、私域实现（⚿ 只占位）。除非站主明确要求——已按站主 2026-08 要求实现**本地管理端**（`npm run admin`，仅本地可视化后台、非站内登录版）；深色模式亦为站主 2026-08 要求
7. **可见性过滤**：所有查询必须带 `visible=true` / `visibility='public'`

## 站主偏好速查

- 暖白色调、现代风（圆角 + 轻阴影），**不是**纯扁平
- 排版正常字号梯度，不要超大字实验
- 微动效克制（基础交互动效 ≤250ms），动效服务可用性不表演。2026-08 站主放开：允许克制的滚动视差、共享元素过渡、暗色模式等进阶项（表演性堆砌仍禁止）
- 内容两类：文章（传统博客）+ 作品/服务（平级入口卡 → 内部详情落地页 → 外链）
- 精选文章手动标记（posts.featured）
- 后台：本地管理端 `npm run admin`（可视化编辑文章/入口卡/身份块，带实时预览，service_role 直连，仅监听 127.0.0.1）+ Supabase Studio 兜底；站内登录版 admin 仍属远期

## 常用命令速查

```bash
npm run dev            # 本地开发 http://localhost:4321
npm run build          # 构建（SSG，构建时拉 Supabase 数据）
npm run admin          # 本地管理端 http://127.0.0.1:4322（可视化编辑，带实时预览，仅本地）
node scripts/gen-sql.mjs  # 修改 seed-data.mjs 后重新生成 supabase/seed.sql
node scripts/og.mjs    # 修改 public/og.svg 后重新生成分享图
```

## 当前阶段

见 README.md 路线图。完成后更新该表状态。M0-M3 已完成；剩余：M4 动效打磨、私域实现、远期站内登录版 admin（本地管理端已实现）。
