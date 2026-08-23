import type { Entry, Post, Profile } from './types';

/** M1 原型假数据。M2 接入 Supabase 后本文件仅保留用于离线开发。数据形状与契约一致。 */

export const mockProfile: Profile = {
  name: 'arcane orion',
  intro: '在构建自己的超级组织：写文章、造产品，把想法变成运行中的服务。',
  motto: '没有结构，就没有理解。',
};

export const mockEntries: Entry[] = [
  // ── 博客（独栏）─────────────────────────────────────────────
  {
    id: 'posts', kind: 'internal', title: '博客', tagline: '写作与思考：结构、AI、量化',
    icon: '✍️', section: 'blog', sort: 10,
  },
  // ── 作品 ───────────────────────────────────────────────────
  {
    id: 'rss-digest', kind: 'service', title: 'rss-digest', tagline: 'AI × 量化信息聚合推送',
    icon: '📡', size_hint: 'md', sort: 20, section: 'works', status: 'running',
    external_url: 'https://rss.alice001.top/',
    landing_description_md: [
      '把分散在各个信息源里的 AI 与量化内容，聚合、筛选并按节奏推送出来。', '',
      '- 自动抓取多个订阅源，AI 摘要降低阅读负担',
      '- 部署在 Cloudflare Workers，稳定运行中',
      '- 我自己每天在用的信息基础设施',
    ].join('\n'),
  },
  {
    id: 'fit-log', kind: 'service', title: 'fit-log', tagline: '健身打卡平台',
    icon: '💪', size_hint: 'md', sort: 30, section: 'works', status: 'running',
    external_url: 'https://fit.alice001.top/',
    landing_description_md: [
      '多人健身打卡社区：动作库、饮食记录、数据看板，配一个 AI 教练。', '',
      '- PWA + APK，手机上直接用',
      '- 支持邀请制多用户',
      '- 持续迭代中的产品',
    ].join('\n'),
  },
  {
    id: 'judgment-arena', kind: 'service', title: 'judgment-arena', tagline: 'AI 当裁判的判断力训练场',
    icon: '⚖️', size_hint: 'md', sort: 40, section: 'works', status: 'running',
    external_url: 'https://arena.alice001.top/',
    landing_description_md: [
      '社会博弈模拟器：AI 扮演 GM，玩家在社会情境中做判断并获得反馈。', '',
      '- 全栈实现，已部署上线',
      '- 训练判断力这件事的产品化尝试',
    ].join('\n'),
  },
  {
    id: 'languages-en', kind: 'service', title: 'languages-en', tagline: '英语 × 科技资讯学习应用',
    icon: '🌐', size_hint: 'md', sort: 45, section: 'works', status: 'building', external_url: null,
    landing_description_md: [
      '英文科技/经济资讯阅读应用：以消费真实资讯为目的，语言习得是副产品。', '',
      '- 点段显译、点词弹卡，查词摩擦趋近于零',
      '- 灵感来源：《AI 时代最需要的四个技能》',
      '- 构建中，敬请期待',
    ].join('\n'),
  },
  {
    id: 'price-watch', kind: 'service', title: 'price-watch', tagline: '多标的行情监控看板',
    icon: '👁', size_hint: 'sm', sort: 50, section: 'works', status: 'running', external_url: null,
    landing_description_md: [
      '15 分钟粒度采集 22 个标的的行情，落 D1 时序库并渲染看板。', '',
      '- 自用工具，未公开访问',
    ].join('\n'),
  },
  {
    id: 'github', kind: 'external', title: 'GitHub', tagline: '全部代码仓库',
    icon: '🐙', size_hint: 'sm', sort: 60, section: 'works',
    external_url: 'https://github.com/ArcaneOrion',
  },
  // ── 服务 ───────────────────────────────────────────────────
  {
    id: 'newapi', kind: 'service', title: 'AI 中转站', tagline: '公益 · OpenAI 兼容接口',
    icon: '🛰️', size_hint: 'md', sort: 70, section: 'services', status: 'running',
    external_url: 'https://newapi.alice001.top/',
    landing_description_md: [
      '面向社区的公益 AI 接口中转服务。', '',
      '- OpenAI 兼容格式，接入即用',
      '- 聚合多个上游渠道',
      '- 免费提供，社区公益运营',
    ].join('\n'),
  },
];

export const mockPosts: Post[] = [
  {
    slug: 'journal-on-journaling',
    title: '关于写笔记这件事',
    summary: '为什么零碎的想法值得记下来——不是因为有结论，而是因为记录本身就是思考的痕迹。',
    tags: ['Journal'], featured: true, published_at: '2026-05-21T00:00:00Z',
    content_md: [
      '## 起因',
      '',
      '零碎的想法看起来没有价值：没有结论，不成体系，甚至过几天自己都看不懂。',
      '',
      '但记录的意义不在于产出结论。**记录本身就是思考的痕迹**——它证明这个念头存在过，也让它有机会和后来的某个想法发生连接。',
      '',
      '## 我的做法',
      '',
      '- 不追求完整，一句话也记',
      '- 定期回看，让旧笔记和新问题相遇',
      '- 笔记之间互相引用，慢慢长出结构',
    ].join('\n'),
  },
  {
    slug: 'agent-self-iteration',
    title: 'Agent 自迭代框架：让模型通过 API 自我优化',
    summary: '探讨如何让大语言模型通过 API 调用实现提示词和任务逻辑的自我优化，涉及无梯度优化和 RL 序列决策。',
    tags: ['AI'], featured: true, published_at: '2026-05-15T00:00:00Z',
    content_md: [
      '## 问题',
      '',
      '模型的能力是固定的，但围绕模型的提示词、工具链和任务逻辑是可以进化的。能不能让 Agent 在运行中改写自己？',
      '',
      '## 思路',
      '',
      '1. 把提示词和流程当作可编辑的外部状态，而不是硬编码',
      '2. 运行结果作为反馈信号，驱动下一轮修改',
      '3. 人审查关键变更，其余自动进行——无梯度优化',
      '',
      '## 和强化学习的关系',
      '',
      'RL 用梯度更新参数；这里的自迭代更新的是**上下文与策略层**。两者不冲突，是不同层面的学习。',
    ].join('\n'),
  },
  {
    slug: 'math-epsilon-delta',
    title: 'ε-δ 证明的结构直觉',
    summary: '从第一道题开始理解极限的严格定义——不是技巧，而是结构。',
    tags: ['Math'], featured: true, published_at: '2026-05-13T00:00:00Z',
    content_md: [
      '## 问题',
      '',
      '证明 x→2 时 (3x − 1) → 5。',
      '',
      '## 直觉',
      '',
      '"x 趋近 2 时函数值趋近 5" 这句话显然，但数学要求把"趋近"翻译成可操作的结构：',
      '',
      '> 对任意 ε > 0，存在 δ > 0，使得 0 < |x−2| < δ 时 |f(x)−5| < ε',
      '',
      '## 结构拆解',
      '',
      '**不是从 ε 出发找 δ，而是从结论反推条件。**对于二次型函数常用 δ = min(1, ε/C)：1 控制局部范围，ε/C 控制精度，取 min 是因为局部有界只在邻域内成立。',
      '',
      '一旦理解这个语义，几乎所有多项式的 ε-δ 证明都遵循同一模板。这就是结构的力量：识别模式，而不是记住技巧。',
    ].join('\n'),
  },
  {
    slug: 'quant-momentum',
    title: '量化因子的第一层直觉：动量',
    summary: '从股市中提炼的第一个量化概念——动量效应为什么存在，以及如何被建模。',
    tags: ['Quant'], featured: true, published_at: '2026-05-10T00:00:00Z',
    content_md: [
      '## 什么是动量',
      '',
      '过去一段时间涨得好的资产，接下来一小段时间往往继续跑赢——这不是玄学，是跨市场反复出现的统计现象。',
      '',
      '## 为什么会存在',
      '',
      '- 信息扩散需要时间，价格对新信息的反应是渐进的',
      '- 资金流动有惯性：业绩好 → 买入 → 继续涨的正反馈',
      '- 行为面：追涨杀跌的人为延迟修正',
      '',
      '## 如何被建模',
      '',
      '最朴素的因子构造：按过去 N 期收益率排序，做多头部、做空尾部，检验分组收益是否单调。**因子有效性 = 收益排名对未来收益排名的预测力**。',
    ].join('\n'),
  },
];
