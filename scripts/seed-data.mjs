#!/usr/bin/env node
/**
 * 种子数据装配：解析 scripts/content/*.md + 内置 entries/profile 定义。
 * 被 gen-sql.mjs（生成 Studio 用的 SQL）共用。
 *
 * entries.section 分栏：'blog'（独栏）| 'works'（作品）| 'services'（服务）
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('缺少 frontmatter');
  const [, fm, body] = m;
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  const strip = (s) => s.replace(/^["']|["']$/g, '');
  const tags = get('tags') ? JSON.parse(get('tags').replace(/'/g, '"')) : [];
  return {
    title: strip(get('title')),
    summary: strip(get('description')),
    tags,
    published_at: new Date(get('date')).toISOString(),
    content_md: body.trim(),
  };
}

export function loadPosts() {
  return readdirSync(join(here, 'content'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      slug: f.replace(/\.md$/, ''),
      featured: true, // 初版全部精选，后续在 Studio 手动调整
      visibility: 'public',
      ...parseFrontmatter(readFileSync(join(here, 'content', f), 'utf8')),
    }));
}

export const profile = {
  id: 1,
  name: 'Arcane Orion',
  intro: '在构建自己的超级组织：写文章、造产品，把想法变成运行中的服务。',
  motto: '没有结构，就没有理解。',
};

export const entries = [
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
    id: 'languages-en', kind: 'service', title: 'languages-en', tagline: '英文日报学习平台',
    icon: '🌐', size_hint: 'md', sort: 45, section: 'works', status: 'running', external_url: 'https://en.alice001.top/',
    landing_description_md: [
      '以英文日报为材料的学习平台：读真实资讯，学场景语言。', '',
      '- 点段显译、点词弹卡，查词摩擦趋近于零',
    ].join('\n'),
  },
  {
    id: 'price-watch', kind: 'service', title: 'price-watch', tagline: '汇率 / 加密 / 股票价格看板',
    icon: '👁', size_hint: 'sm', sort: 50, section: 'works', status: 'running', external_url: 'https://price.alice001.top/',
    landing_description_md: [
      '聚合多来源行情的价格看板：汇率、加密货币与股票。', '',
      '- 15 分钟自动更新，内置 MACD 走势指标',
      '- 数据源：ECB / 新浪 / CoinGecko',
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
