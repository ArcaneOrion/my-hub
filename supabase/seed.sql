-- my-hub 种子数据（幂等：重复执行只更新不重复插入）

-- 生成：node scripts/gen-sql.mjs · 在 Studio SQL Editor 中整段执行



insert into profile (id, name, intro, motto) values (1, 'arcane orion', '在构建自己的超级组织：写文章、造产品，把想法变成运行中的服务。', '没有结构，就没有理解。')
on conflict (id) do update set name = excluded.name, intro = excluded.intro, motto = excluded.motto;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('posts', 'internal', '博客', '写作与思考：结构、AI、量化', '✍️', 'md', 10, true, 'blog', null, null, null)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('rss-digest', 'service', 'rss-digest', 'AI × 量化信息聚合推送', '📡', 'md', 20, true, 'works', 'running', 'https://rss.alice001.top/', $md$把分散在各个信息源里的 AI 与量化内容，聚合、筛选并按节奏推送出来。

- 自动抓取多个订阅源，AI 摘要降低阅读负担
- 部署在 Cloudflare Workers，稳定运行中
- 我自己每天在用的信息基础设施$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('fit-log', 'service', 'fit-log', '健身打卡平台', '💪', 'md', 30, true, 'works', 'running', 'https://fit.alice001.top/', $md$多人健身打卡社区：动作库、饮食记录、数据看板，配一个 AI 教练。

- PWA + APK，手机上直接用
- 支持邀请制多用户
- 持续迭代中的产品$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('judgment-arena', 'service', 'judgment-arena', 'AI 当裁判的判断力训练场', '⚖️', 'md', 40, true, 'works', 'running', 'https://arena.alice001.top/', $md$社会博弈模拟器：AI 扮演 GM，玩家在社会情境中做判断并获得反馈。

- 全栈实现，已部署上线
- 训练判断力这件事的产品化尝试$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('languages-en', 'service', 'languages-en', '英文日报学习平台', '🌐', 'md', 45, true, 'works', 'running', 'https://en.alice001.top/', $md$以英文日报为材料的学习平台：读真实资讯，学场景语言。

- 点段显译、点词弹卡，查词摩擦趋近于零$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('price-watch', 'service', 'price-watch', '汇率 / 加密 / 股票价格看板', '👁', 'sm', 50, true, 'works', 'running', 'https://price.alice001.top/', $md$聚合多来源行情的价格看板：汇率、加密货币与股票。

- 15 分钟自动更新，内置 MACD 走势指标
- 数据源：ECB / 新浪 / CoinGecko$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('github', 'external', 'GitHub', '全部代码仓库', '🐙', 'sm', 60, true, 'works', null, 'https://github.com/ArcaneOrion', null)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md) values ('newapi', 'service', 'AI 中转站', '公益 · OpenAI 兼容接口', '🛰️', 'md', 70, true, 'services', 'running', 'https://newapi.alice001.top/', $md$面向社区的公益 AI 接口中转服务。

- OpenAI 兼容格式，接入即用
- 聚合多个上游渠道
- 免费提供，社区公益运营$md$)
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, section = excluded.section, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;

insert into posts (slug, title, summary, content_md, tags, featured, visibility, published_at, updated_at)
values ('agent-self-iteration', 'Agent 自迭代框架：让模型通过 API 自我优化', '探讨如何让大语言模型通过 API 调用实现提示词和任务逻辑的自我优化，涉及无梯度优化和 RL 序列决策。', $md$## 核心问题

当前 Agent 系统的瓶颈在于：人类编写的提示词和任务逻辑是静态的，无法随使用场景演化。当模型遇到新类型的任务或错误时，它需要外部的人工干预来调整。

**假设**：如果模型能通过 API 调用读取和修改自身的提示词，它是否能实现某种形式的自优化？

## 框架设计

### 三层结构

```
┌─────────────────────────────────────┐
│  算法层（你设计的）                    │
│  ├── 何时触发记忆检索？               │
│  ├── 检索结果如何排序/过滤？           │
│  ├── 多条记忆如何去重/合并？            │
│  ├── token budget 如何动态分配？       │
│  └── 知识冲突如何处理？                │
├─────────────────────────────────────┤
│  模型层（API 调用）                    │
│  ├── 从对话中提取事实                  │
│  ├── 判断信息是否值得记忆               │
│  └── 最终生成回复                     │
└─────────────────────────────────────┘
```

### 关键洞察

设计原则应是 **harness（驾驭）** 而非 **restrict（限制）**：提供框架让模型发挥能力，而非用 rigid 规则约束它。随模型能力迭代，架构本身应该简化。

## 待解决的问题

- 自优化的收敛性如何保证？
- 如何避免提示词漂移（prompt drift）到不可用的状态？
- 验证循环：模型如何知道自己"改好了"？

> 本文框架仍在演化中，后续会结合具体实验数据更新。$md$, array['AI'], true, 'public', '2026-05-15T00:00:00.000Z', now())
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, content_md = excluded.content_md,
  tags = excluded.tags, featured = excluded.featured, visibility = excluded.visibility,
  published_at = excluded.published_at, updated_at = now();

insert into posts (slug, title, summary, content_md, tags, featured, visibility, published_at, updated_at)
values ('journal-on-journaling', '关于写笔记这件事', '为什么零碎的想法值得记下来——不是因为有结论，而是因为记录本身就是思考的痕迹。', $md$## 起因

我一直在犹豫要不要开一个 journal 版块。正式的文章有结构、有论点、有结论，而 journal 更像是一个人自言自语。但后来想明白了：那些没能变成文章的半成品，恰恰是最诚实的思考现场。

## 记录的三种形态

1. **片段**：一句话的直觉，比如"梯度下降和进化压力是不是同一件事"。不知道答案，但值得留着。
2. **笔记**：读完一篇论文或一本书之后，用自己的话重新组织一遍。不是摘要，是消化。
3. **日志**：某天做了什么、踩了什么坑。回头看的时候，能还原出当时的思路。

这三种东西混在一起也没关系。journal 不需要分类，它本身就是时间线。

## 这个版块的规则

没有规则。可以是一段代码、一个未完成的证明、一次失败的实验、或者凌晨三点的胡思乱想。唯一的约束是：**写下来**。

不写下来的想法会蒸发。写下来的至少可以发酵。$md$, array['Journal'], true, 'public', '2026-05-21T00:00:00.000Z', now())
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, content_md = excluded.content_md,
  tags = excluded.tags, featured = excluded.featured, visibility = excluded.visibility,
  published_at = excluded.published_at, updated_at = now();

insert into posts (slug, title, summary, content_md, tags, featured, visibility, published_at, updated_at)
values ('math-epsilon-delta', 'ε-δ 证明的结构直觉', '从第一道题开始理解极限的严格定义——不是技巧，而是结构。', $md$## 问题

证明：

$$
\lim_{x \to 2} (3x - 1) = 5
$$

## 直觉

"x 趋近 2 时，3x-1 趋近 5"——这句话的直觉是显然的。但数学要求我们把"趋近"翻译成可操作的结构。

## ε-δ 结构拆解

```
∀ε > 0, ∃δ > 0, 使得：
  |x - 2| < δ  ⟹  |(3x - 1) - 5| < ε
```

**不是从 ε 出发找 δ，而是从结论反推条件**。

## 关键技巧：局部有界控制

对于二次函数的极限，常需要 `δ = min(1, ε/C)` 这种结构。

**为什么 min(1, ...)**：
- `1` 控制局部范围（确保函数在该范围内可被线性控制）
- `ε/C` 控制误差精度

**为什么两者取 min**：因为局部有界只在某个邻域内成立，超出这个范围线性控制失效。

## 结构迁移

一旦理解 `min(1, ε/C)` 的语义，几乎所有多项式函数的 ε-δ 证明都遵循同一模板。

这就是结构的力量——不是记住技巧，而是识别模式。$md$, array['Math'], true, 'public', '2026-05-13T00:00:00.000Z', now())
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, content_md = excluded.content_md,
  tags = excluded.tags, featured = excluded.featured, visibility = excluded.visibility,
  published_at = excluded.published_at, updated_at = now();

insert into posts (slug, title, summary, content_md, tags, featured, visibility, published_at, updated_at)
values ('quant-momentum', '量化因子的第一层直觉：动量', '从股市中提炼的第一个量化概念——动量效应为什么存在，以及如何被建模。', $md$## 现象

股票市场中存在一种反直觉的现象：**过去涨的股票，未来更可能继续涨**。这与"均值回归"的直觉相反。

这就是**动量效应（Momentum Effect）**，由 Jegadeesh & Titman (1993) 系统记录。

## 为什么存在？

三种解释框架：

1. **行为金融学**：投资者反应不足。好消息逐步被消化，而非瞬间反映到价格中。
2. **风险补偿**：高动量股票可能承载某种未被定价的风险因子。
3. **市场微观结构**：机构资金的流动产生持续性。

## 最简单的动量因子

$$
\text{Momentum}_{i,t} = \frac{P_{i,t} - P_{i,t-12M}}{P_{i,t-12M}}
$$

12 个月收益率。按此排序，做多 top 20%，做空 bottom 20%。

## 陷阱

- **反转期**：动量在 12 个月窗口有效，但在 1 个月窗口常反转
- **崩盘风险**：动量策略在危机中回撤极大
- **容量限制**：规模大了 alpha 衰减

> 本文仅作概念介绍，不构成投资建议。$md$, array['Quant'], true, 'public', '2026-05-10T00:00:00.000Z', now())
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, content_md = excluded.content_md,
  tags = excluded.tags, featured = excluded.featured, visibility = excluded.visibility,
  published_at = excluded.published_at, updated_at = now();
