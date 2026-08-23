#!/usr/bin/env node
/**
 * 生成 supabase/seed.sql —— 供 Supabase Studio SQL Editor 直接执行的幂等种子。
 * 用法：node scripts/gen-sql.mjs   （输出重定向或直接查看文件）
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, entries, loadPosts } from './seed-data.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** 单引号转义（短字符串用） */
const q = (s) => `'${String(s).replaceAll("'", "''")}'`;
/** dollar-quote 包裹 Markdown 正文，避免引号地狱 */
const dq = (s) => `$md$${s}$md$`;
/** text[] 字面量 */
const arr = (a) => `array[${a.map(q).join(',')}]`;

const out = [];
out.push(`-- my-hub 种子数据（幂等：重复执行只更新不重复插入）`);
out.push(`-- 生成：node scripts/gen-sql.mjs · 在 Studio SQL Editor 中整段执行`);
out.push('');

// profile
out.push(`insert into profile (id, name, intro, motto) values (${profile.id}, ${q(profile.name)}, ${q(profile.intro)}, ${q(profile.motto)})
on conflict (id) do update set name = excluded.name, intro = excluded.intro, motto = excluded.motto;`);

// entries
for (const e of entries) {
  const cols = `id, kind, title, tagline, icon, size_hint, sort, visible, status, external_url, landing_description_md`;
  const vals = `${q(e.id)}, ${q(e.kind)}, ${q(e.title)}, ${e.tagline ? q(e.tagline) : 'null'}, ${e.icon ? q(e.icon) : 'null'}, ${q(e.size_hint ?? 'md')}, ${e.sort ?? 100}, true, ${e.status ? q(e.status) : 'null'}, ${e.external_url ? q(e.external_url) : 'null'}, ${e.landing_description_md ? dq(e.landing_description_md) : 'null'}`;
  out.push(`insert into entries (${cols}) values (${vals})
on conflict (id) do update set
  kind = excluded.kind, title = excluded.title, tagline = excluded.tagline,
  icon = excluded.icon, size_hint = excluded.size_hint, sort = excluded.sort,
  visible = excluded.visible, status = excluded.status,
  external_url = excluded.external_url, landing_description_md = excluded.landing_description_md;`);
}

// posts
for (const p of loadPosts()) {
  out.push(`insert into posts (slug, title, summary, content_md, tags, featured, visibility, published_at, updated_at)
values (${q(p.slug)}, ${q(p.title)}, ${q(p.summary)}, ${dq(p.content_md)}, ${arr(p.tags)}, ${p.featured}, ${q(p.visibility)}, '${p.published_at}', now())
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, content_md = excluded.content_md,
  tags = excluded.tags, featured = excluded.featured, visibility = excluded.visibility,
  published_at = excluded.published_at, updated_at = now();`);
}

writeFileSync(join(here, '../supabase/seed.sql'), out.join('\n\n') + '\n');
console.log(`✓ 已生成 supabase/seed.sql（profile ×1, entries ×${entries.length}, posts ×${loadPosts().length}）`);
