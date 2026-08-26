#!/usr/bin/env node
/**
 * my-hub 本地管理端 server（独立于生产构建）
 *
 * 用法：npm run admin
 * 仅监听 127.0.0.1，用 Supabase service_role key 直连，提供
 * entries / posts / profile 三张表的读写 API，并托管 admin/ 下的静态 UI。
 *
 * 安全边界：
 * - 只绑定回环地址，不对局域网/公网暴露
 * - service_role key 只存在于本地 .env（已 gitignore），绝不进入浏览器或生产产物
 * - 写接口要求 JSON body（天然挡 form 类 CSRF），且不返回任何 CORS 头
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import MarkdownIt from 'markdown-it';
import katexPluginMod from '@vscode/markdown-it-katex';

const here = dirname(fileURLToPath(import.meta.url));

// ── 极简 .env 解析（零依赖）─────────────────────────────────
function loadEnv(file) {
  const out = {};
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[k] = v;
    }
  } catch { /* 文件不存在时忽略，交给 process.env */ }
  return out;
}

const env = { ...loadEnv(join(here, '..', '.env')), ...process.env };

const SUPABASE_URL = env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    [
      '❌ 缺少环境变量。请在项目根目录 .env 中补齐：',
      '   PUBLIC_SUPABASE_URL        （已存在即可）',
      '   SUPABASE_SERVICE_ROLE_KEY  （Supabase 后台 → Project Settings → API → service_role）',
      '',
      '注意：service_role 拥有数据库全权限，仅用于本地管理端，切勿提交到 git 或写入生产。',
    ].join('\n'),
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Markdown 渲染器：与生产站 posts/[slug].astro 同一套配置（markdown-it + KaTeX）
const katexPlugin = katexPluginMod?.default ?? katexPluginMod;
const md = new MarkdownIt({ html: false, linkify: true }).use(katexPlugin);

const PORT = Number(env.ADMIN_PORT) || 4322;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

// ── 表字段白名单（不在此列的字段一律不写入，防止误传 created_at / id 等）──
const TABLES = {
  entries: {
    fields: ['id', 'kind', 'title', 'tagline', 'icon', 'accent', 'size_hint', 'sort', 'visible', 'section', 'landing_description_md', 'status', 'external_url'],
    nullable: ['tagline', 'icon', 'accent', 'landing_description_md', 'status', 'external_url'],
    required: ['id', 'kind', 'title'],
    // NOT NULL 且有默认值的列。SQL 里显式 INSERT NULL 会绕过 DB default 直接报
    // 23502（not-null violation），所以这些字段收到空值时在应用层填默认值。
    defaults: { size_hint: 'md', sort: 100, visible: true, section: 'works' },
    key: 'id',
  },
  posts: {
    fields: ['slug', 'title', 'summary', 'content_md', 'tags', 'featured', 'visibility', 'published_at'],
    nullable: [],
    required: ['slug', 'title', 'summary', 'content_md', 'published_at'],
    defaults: { tags: [], featured: false, visibility: 'public' },
    key: 'slug',
  },
  profile: {
    fields: ['name', 'intro', 'motto'],
    nullable: [],
    required: ['name', 'intro', 'motto'],
    key: 'id',
  },
};

// ── 工具 ────────────────────────────────────────────────────
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve(null); }
    });
  });

/** 只保留白名单字段 */
const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
};

/** 可空字段的空字符串统一转 null（可选列允许清空） */
const clean = (row, nullable) => {
  for (const k of Object.keys(row)) if (row[k] === '' && nullable.includes(k)) row[k] = null;
  return row;
};

const missingRequired = (body, spec) => spec.required.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');

/** NOT NULL 列兑底：insert 时缺失/空值一律填默认值；update 仅当字段出现在 payload
 *  且值为空时才兑底（保持 partial update 语义，不重置未提交的字段）。 */
const fillDefaults = (row, defaults, fillMissing) => {
  for (const [k, v] of Object.entries(defaults)) {
    const empty = row[k] === null || row[k] === undefined || row[k] === '';
    if (empty && (fillMissing || k in row)) row[k] = v;
  }
  return row;
};

// ── 资源处理 ────────────────────────────────────────────────
async function handleEntries(req, res, key, body) {
  const spec = TABLES.entries;
  const table = supabase.from('entries');
  switch (req.method) {
    case 'GET': {
      const { data, error } = await table.select('*').order('sort', { ascending: true });
      if (error) throw error;
      return send(res, 200, data);
    }
    case 'POST': {
      const miss = missingRequired(body, spec);
      if (miss.length) return send(res, 400, { error: `缺少必填字段：${miss.join(', ')}` });
      const row = fillDefaults(clean(pick(body, spec.fields), spec.nullable), spec.defaults, true);
      const { data, error } = await table.insert(row).select().single();
      if (error) throw error;
      return send(res, 201, data);
    }
    case 'PUT': {
      if (!key) return send(res, 400, { error: '缺少 id' });
      const row = fillDefaults(clean(pick(body, spec.fields), spec.nullable), spec.defaults, false);
      const { data, error } = await table.update(row).eq('id', key).select().single();
      if (error) throw error;
      return send(res, 200, data);
    }
    case 'DELETE': {
      if (!key) return send(res, 400, { error: '缺少 id' });
      const { error } = await table.delete().eq('id', key);
      if (error) throw error;
      return send(res, 200, { ok: true });
    }
    default:
      return send(res, 405, { error: 'method not allowed' });
  }
}

async function handlePosts(req, res, key, body) {
  const spec = TABLES.posts;
  const table = supabase.from('posts');
  switch (req.method) {
    case 'GET': {
      const { data, error } = await table.select('*').order('published_at', { ascending: false });
      if (error) throw error;
      return send(res, 200, data);
    }
    case 'POST': {
      const miss = missingRequired(body, spec);
      if (miss.length) return send(res, 400, { error: `缺少必填字段：${miss.join(', ')}` });
      const row = fillDefaults(clean(pick(body, spec.fields), spec.nullable), spec.defaults, true);
      const { data, error } = await table.insert(row).select().single();
      if (error) throw error;
      return send(res, 201, data);
    }
    case 'PUT': {
      if (!key) return send(res, 400, { error: '缺少 slug' });
      const row = fillDefaults(clean(pick(body, spec.fields), spec.nullable), spec.defaults, false);
      const { data, error } = await table.update(row).eq('slug', key).select().single();
      if (error) throw error;
      return send(res, 200, data);
    }
    case 'DELETE': {
      if (!key) return send(res, 400, { error: '缺少 slug' });
      const { error } = await table.delete().eq('slug', key);
      if (error) throw error;
      return send(res, 200, { ok: true });
    }
    default:
      return send(res, 405, { error: 'method not allowed' });
  }
}

async function handleProfile(req, res, _key, body) {
  const spec = TABLES.profile;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('profile').select('*').eq('id', 1).single();
    if (error) throw error;
    return send(res, 200, data);
  }
  if (req.method === 'PUT') {
    const row = { id: 1, ...clean(pick(body, spec.fields), spec.nullable) };
    const { data, error } = await supabase.from('profile').upsert(row).select().single();
    if (error) throw error;
    return send(res, 200, data);
  }
  return send(res, 405, { error: 'method not allowed' });
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', resource, key?]
  const resource = parts[1];
  const key = parts[2] ? decodeURIComponent(parts[2]) : null;

  let body = null;
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    body = await readBody(req);
    if (body === null) return send(res, 400, { error: '请求体需为 JSON' });
  }

  try {
    if (resource === 'entries') return await handleEntries(req, res, key, body);
    if (resource === 'posts') return await handlePosts(req, res, key, body);
    if (resource === 'profile') return await handleProfile(req, res, key, body);
    if (resource === 'preview') return send(res, 200, { html: md.render(body?.md ?? '') });
    return send(res, 404, { error: `未知资源 /api/${resource}` });
  } catch (err) {
    console.error('[admin] API error:', err);
    // 唯一键冲突（重复 id/slug）：转友好提示，不透出 Postgres 原文
    if (err?.code === '23505') {
      return send(res, 409, { error: `保存失败：${err.details ?? '已存在相同的 id/slug'}，请更换后重试` });
    }
    return send(res, 500, { error: err?.message ?? String(err) });
  }
}

// ── 托管 node_modules/katex/dist 静态资源（预览 iframe 加载公式 CSS/字体）──
const VENDOR_ROOT = normalize(join(here, '..', 'node_modules', 'katex', 'dist'));
function serveVendor(res, url) {
  const rel = url.pathname.replace(/^\/vendor\/katex\//, '');
  const filePath = normalize(join(VENDOR_ROOT, decodeURIComponent(rel)));
  if (filePath !== VENDOR_ROOT && !filePath.startsWith(VENDOR_ROOT + '/')) return send(res, 403, { error: 'forbidden' });
  try {
    const body = readFileSync(filePath);
    const type = MIME[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    send(res, 404, { error: 'not found' });
  }
}

// ── 静态文件（仅 admin/ 目录内，防路径穿越）─────────────────
function serveStatic(req, res, url) {
  const rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = normalize(join(here, decodeURIComponent(rel)));
  if (filePath !== here && !filePath.startsWith(here + '/')) return send(res, 403, { error: 'forbidden' });
  try {
    const body = readFileSync(filePath);
    const type = MIME[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    send(res, 404, { error: 'not found' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  if (url.pathname.startsWith('/vendor/')) return serveVendor(res, url);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, url);
  return send(res, 405, { error: 'method not allowed' });
});

server.listen(PORT, HOST, () => {
  console.log('\n🛠  my-hub 本地管理端已启动：');
  console.log(`   http://${HOST}:${PORT}\n`);
  console.log('   仅监听回环地址，Ctrl+C 退出。\n');
});
