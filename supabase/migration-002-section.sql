-- migration 002：entries 增加分栏字段 section（blog|works|services）
-- 在 Studio SQL Editor 中执行；幂等。

alter table entries add column if not exists section text not null default 'works';

update entries set section = 'blog' where id = 'posts';

-- 新增：languages-en（构建中）
insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md)
values ('languages-en', 'service', 'languages-en', '英语 × 科技资讯学习应用', '🌐', 'md', 45, true, 'works', 'building', null,
$md$英文科技/经济资讯阅读应用：以消费真实资讯为目的，语言习得是副产品。

- 点段显译、点词弹卡，查词摩擦趋近于零
- 灵感来源：《AI 时代最需要的四个技能》
- 构建中，敬请期待$md$)
on conflict (id) do update set
  title = excluded.title, tagline = excluded.tagline, icon = excluded.icon,
  section = excluded.section, status = excluded.status,
  landing_description_md = excluded.landing_description_md;

-- 新增：AI 中转站（公益服务）
insert into entries (id, kind, title, tagline, icon, size_hint, sort, visible, section, status, external_url, landing_description_md)
values ('newapi', 'service', 'AI 中转站', '公益 · OpenAI 兼容接口', '🛰️', 'md', 70, true, 'services', 'running', 'https://newapi.alice001.top/',
$md$面向社区的公益 AI 接口中转服务。

- OpenAI 兼容格式，接入即用
- 聚合多个上游渠道
- 免费提供，社区公益运营$md$)
on conflict (id) do update set
  title = excluded.title, tagline = excluded.tagline, icon = excluded.icon,
  section = excluded.section, status = excluded.status, external_url = excluded.external_url,
  landing_description_md = excluded.landing_description_md;
