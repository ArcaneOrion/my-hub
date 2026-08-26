// my-hub 本地管理端 UI —— 原生 JS，schema 驱动，零框架依赖
const $main = document.getElementById('main');
const $tabs = document.getElementById('tabs');
const $modalRoot = document.getElementById('modal-root');
const $toast = document.getElementById('toast');

// ── 资源 schema ─────────────────────────────────────────────
const SCHEMA = {
  posts: {
    label: '文章',
    key: 'slug',
    listCols: [
      { key: 'title', label: '标题', title: true },
      { key: 'published_at', label: '发布时间', format: 'date' },
      { key: 'tags', label: '标签', format: 'tags' },
      { key: 'featured', label: '精选', format: 'bool' },
      { key: 'visibility', label: '可见性' },
    ],
    fields: [
      { key: 'slug', label: 'slug', type: 'text', required: true, readOnlyOnEdit: true, hint: 'URL 标识，唯一，创建后不改' },
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'summary', label: '摘要', type: 'textarea', prose: true, required: true },
      { key: 'tags', label: '标签', type: 'tags', hint: '逗号分隔，如：AI, 量化' },
      { key: 'content_md', label: '正文 Markdown', type: 'textarea', large: true, required: true, full: true },
      { key: 'featured', label: '精选', type: 'checkbox', hint: '首页精选文章区展示' },
      { key: 'visibility', label: '可见性', type: 'select', options: ['public', 'unlisted', 'members'] },
      { key: 'published_at', label: '发布时间', type: 'datetime', required: true, defaultNow: true },
    ],
  },
  entries: {
    label: '入口卡',
    key: 'id',
    listCols: [
      { key: 'id', label: 'id', mono: true },
      { key: 'title', label: '标题', title: true },
      { key: 'kind', label: '类型' },
      { key: 'section', label: '分栏' },
      { key: 'sort', label: '排序' },
      { key: 'visible', label: '可见', format: 'bool' },
    ],
    fields: [
      { key: 'id', label: 'id', type: 'text', required: true, readOnlyOnEdit: true, hint: 'slug，如 posts / fit-log，唯一' },
      { key: 'kind', label: '类型', type: 'select', required: true, options: ['internal', 'service', 'external'] },
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'tagline', label: '一句话介绍', type: 'text', nullable: true },
      { key: 'icon', label: '图标', type: 'text', nullable: true, hint: 'emoji 占位，如 ✍️ / 📡' },
      { key: 'accent', label: '点缀色', type: 'text', nullable: true, hint: '如 #B45309，可留空' },
      { key: 'size_hint', label: 'Bento 尺寸', type: 'select', options: ['sm', 'md', 'lg'] },
      { key: 'sort', label: '排序', type: 'number', hint: '数字越小越靠前' },
      { key: 'visible', label: '可见', type: 'checkbox' },
      { key: 'section', label: '分栏', type: 'select', options: ['blog', 'works', 'services'] },
      { key: 'landing_description_md', label: '详情页正文 Markdown', type: 'textarea', large: true, prose: true, nullable: true, full: true, hint: 'service 类型专用，预览切「详情页」查看' },
      { key: 'status', label: '状态', type: 'select', options: ['', 'running', 'building', 'archived'], nullable: true },
      { key: 'external_url', label: '外链', type: 'text', nullable: true, hint: 'https://...' },
    ],
  },
  profile: {
    label: '身份块',
    key: 'id',
    single: true,
    fields: [
      { key: 'name', label: '姓名', type: 'text', required: true },
      { key: 'intro', label: '简介', type: 'textarea', prose: true, required: true },
      { key: 'motto', label: '座右铭', type: 'text', required: true },
    ],
  },
};

let currentTab = 'posts';
// entries 预览视图：'grid' 首页网格实况 | 'landing' 详情落地页
let pvMode = 'grid';

// ── 基础工具 ────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

let toastTimer;
function toast(msg, isError = false) {
  $toast.textContent = msg;
  $toast.className = 'toast' + (isError ? ' error' : '');
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($toast.hidden = true), 2600);
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

function fmtCell(col, value) {
  if (col.format === 'date') return value ? new Date(value).toLocaleDateString('zh-CN') : '';
  if (col.format === 'tags') return Array.isArray(value) ? value.join(', ') : '';
  if (col.format === 'bool') return `<span class="badge ${value ? 'on' : ''}">${value ? '是' : '否'}</span>`;
  if (col.mono) return `<span class="mono">${esc(value)}</span>`;
  return esc(value);
}

// ── 渲染 ────────────────────────────────────────────────────
async function render() {
  const spec = SCHEMA[currentTab];
  if (spec.single) return renderProfile(spec);
  pvMode = 'grid'; // 切 tab 时重置预览视图
  return renderList(spec);
}

async function renderList(spec) {
  $main.innerHTML = `
    <div class="toolbar">
      <h2>${spec.label}</h2>
      <div><span class="hint">修改后需重新构建生产才上线（Deploy Hook）</span>
      <button class="btn primary" id="new-btn">＋ 新建</button></div>
    </div>
    <table class="table">
      <thead><tr>${spec.listCols.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead>
      <tbody id="rows"><tr><td colspan="${spec.listCols.length + 1}" class="empty">加载中…</td></tr></tbody>
    </table>`;

  document.getElementById('new-btn').addEventListener('click', () => openModal(spec, null));

  let rows;
  try {
    rows = await api(`/api/${currentTab}`);
  } catch (e) {
    document.getElementById('rows').innerHTML = `<tr><td colspan="${spec.listCols.length + 1}" class="empty">${esc(e.message)}</td></tr>`;
    return;
  }

  if (!rows.length) {
    document.getElementById('rows').innerHTML = `<tr><td colspan="${spec.listCols.length + 1}" class="empty">暂无数据</td></tr>`;
    return;
  }

  document.getElementById('rows').innerHTML = rows
    .map(
      (r) => `<tr>
        ${spec.listCols.map((c) => `<td class="${c.title ? 'cell-title' : c.mono ? '' : ''}">${fmtCell(c, r[c.key])}</td>`).join('')}
        <td class="row-actions">
          <button class="btn small" data-act="edit" data-key="${esc(r[spec.key])}">编辑</button>
          <button class="btn small danger" data-act="del" data-key="${esc(r[spec.key])}">删除</button>
        </td>
      </tr>`,
    )
    .join('');

  document.getElementById('rows').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const key = btn.dataset.key;
    if (btn.dataset.act === 'edit') {
      const row = rows.find((r) => r[spec.key] === key);
      openModal(spec, row);
    } else if (btn.dataset.act === 'del') {
      const row = rows.find((r) => r[spec.key] === key);
      if (!confirm(`确定删除「${row?.title ?? key}」？此操作不可撤销。`)) return;
      try {
        await api(`/api/${currentTab}/${encodeURIComponent(key)}`, { method: 'DELETE' });
        toast('已删除');
        render();
      } catch (err) { toast(err.message, true); }
    }
  });
}

async function renderProfile(spec) {
  $main.innerHTML = `<div class="toolbar"><h2>${spec.label}</h2><span class="hint">单行数据，直接编辑保存</span></div>
    <div class="editor-grid">
      <div class="form-card" id="profile-form">加载中…</div>
      <aside class="preview-pane">
        <div class="preview-label">实时预览</div>
        <iframe id="preview-frame" title="预览"></iframe>
      </aside>
    </div>`;

  let data;
  try { data = await api('/api/profile'); } catch (e) { $main.querySelector('#profile-form').textContent = e.message; return; }

  const fields = spec.fields;
  $main.querySelector('#profile-form').innerHTML = buildFields(fields, data) + `
    <div class="modal-footer"><button class="btn primary" id="save-btn">保存</button></div>`;

  bindPreviewFrame();
  const schedulePreview = debounce(() => updatePreview(fields), 250);
  updatePreview(fields);
  $main.addEventListener('input', schedulePreview);

  document.getElementById('save-btn').addEventListener('click', async () => {
    try {
      const payload = collect(fields);
      await api('/api/profile', { method: 'PUT', body: JSON.stringify(payload) });
      toast('已保存');
    } catch (e) { toast(e.message, true); }
  });
}

// ── 表单构建与收集 ─────────────────────────────────────────
function fieldInput(f, value) {
  const val = value ?? '';
  const label = `<label>${f.label}${f.required ? '<span class="req">*</span>' : ''}</label>`;
  const hint = f.hint ? `<div class="hint">${f.hint}</div>` : '';
  let input = '';
  if (f.type === 'textarea') {
    input = `<textarea class="${f.large ? 'large ' : ''}${f.prose ? 'prose ' : ''}" data-key="${f.key}">${esc(val)}</textarea>`;
  } else if (f.type === 'tags') {
    input = `<input type="text" data-key="${f.key}" value="${esc(Array.isArray(val) ? val.join(', ') : val)}" />`;
  } else if (f.type === 'checkbox') {
    // checkbox 自带 label（点击文字也可勾选）；额外 hint 追加在右侧
    input = `<div class="check-row"><label class="check-label"><input type="checkbox" data-key="${f.key}" ${val ? 'checked' : ''} /> ${f.label}</label>${f.hint ? `<span class="hint">${f.hint}</span>` : ''}</div>`;
  } else if (f.type === 'select') {
    input = `<select data-key="${f.key}">${f.options.map((o) => `<option value="${esc(o)}" ${String(o) === String(val) ? 'selected' : ''}>${o === '' ? '（无）' : esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'datetime') {
    input = `<input type="datetime-local" data-key="${f.key}" value="${toLocalInput(val)}" />`;
  } else if (f.type === 'number') {
    input = `<input type="number" data-key="${f.key}" value="${esc(val)}" />`;
  } else {
    input = `<input type="text" data-key="${f.key}" value="${esc(val)}" />`;
  }
  return `<div class="field ${f.full ? 'full' : ''}">${f.type === 'checkbox' ? '' : label}${input}${f.type === 'checkbox' ? '' : hint}</div>`;
}

function buildFields(fields, data) {
  const halves = fields.filter((f) => !f.full);
  const fulls = fields.filter((f) => f.full);
  const halfHtml = halves.map((f) => fieldInput(f, data?.[f.key])).join('');
  const fullHtml = fulls.map((f) => fieldInput(f, data?.[f.key])).join('');
  return `<div class="field-grid">${halfHtml}</div>${fullHtml}`;
}

function collect(fields) {
  const out = {};
  for (const f of fields) {
    const el = $modalRoot.querySelector(`[data-key="${f.key}"]`) || $main.querySelector(`[data-key="${f.key}"]`);
    if (!el) continue;
    let v;
    if (f.type === 'checkbox') v = el.checked;
    else if (f.type === 'tags') v = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'datetime') v = fromLocalInput(el.value);
    else if (f.type === 'number') v = el.value === '' ? null : Number(el.value);
    else v = el.value.trim();

    if (f.required && (v === '' || v === null || (Array.isArray(v) && !v.length))) {
      throw new Error(`请填写「${f.label}」`);
    }
    if (v === '' && f.nullable) v = null;
    out[f.key] = v;
  }
  return out;
}

// ── 实时预览 ────────────────────────────────────────────────
// 预览 iframe 内复刻生产站设计令牌 + 卡片 + bento 网格 + 文章/落地页排版，
// 所有可见文案均来自表单实际值；更新时只替换 body 不整页重载（保滚动、不闪烁）
const PREVIEW_CSS = `
:root{--bg:#FAF7F2;--surface:#FFFFFF;--ink:#1C1917;--ink-muted:#78716C;--line:#E7E0D8;--line-strong:#D9CFC2;--accent:#B45309;--radius-card:16px;--radius-sm:10px;--shadow-rest:0 1px 2px rgb(28 25 23/0.05),0 4px 12px rgb(28 25 23/0.06)}
*{box-sizing:border-box}
body{margin:0;padding:20px;background:var(--bg);color:var(--ink);font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.7;font-size:15px}
.stack{display:flex;flex-direction:column;gap:16px;max-width:68ch;margin-inline:auto}
.card{background:var(--surface);border-radius:var(--radius-card);box-shadow:var(--shadow-rest);border:1px solid var(--line);padding:24px}
a{color:inherit;text-decoration:none}
.muted{color:var(--ink-muted)}
.mono{font-family:"JetBrains Mono",Consolas,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.meta{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--ink-muted)}
.postcard h2,.entrycard h2{margin:10px 0 0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.postcard .clamp{margin:8px 0 0;font-size:13.5px}
.entrycard .top{display:flex;justify-content:space-between;align-items:flex-start}
.entrycard .icon{font-size:26px;line-height:1}
.entrycard .muted{margin-top:6px;font-size:13.5px;line-height:1.6;min-height:44px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.arrow{display:inline-block;transition:transform .2s}
.entrycard:hover .arrow,.blog-banner:hover .arrow{transform:translateX(4px);color:var(--accent)}
.dot{width:8px;height:8px;border-radius:9999px;display:inline-block;flex:none}
.dot.running{background:#16A34A}.dot.building{background:#D97706}.dot.archived{background:#A8A29E}
.badge-s{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--ink-muted)}

/* 首页 bento 网格实况（格子画布制，与生产同构）：行高固定 160px，
   大小只由跨度决定（lg=2×2），padding 统一，内容 space-between 填满格子 */
.bento{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));grid-auto-rows:160px;gap:12px;grid-auto-flow:dense}
.bento .entrycard{display:flex;flex-direction:column;justify-content:space-between;margin:0;padding:24px}
.bento .entrycard.lg{grid-column:span 2;grid-row:span 2}
.bento .entrycard.lg h2{font-size:19px}
/* services 区生产为 sm:2列/lg:3列，同样固定行高 */
.svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));grid-auto-rows:160px;gap:12px}
.svc-grid .entrycard{padding:24px;display:flex;flex-direction:column;justify-content:space-between}
/* 当前编辑中的卡高亮 */
.current{outline:2px solid var(--accent);outline-offset:2px}
/* blog 分栏横幅卡（生产首页「博客」入口形态） */
.blog-banner{display:flex;align-items:center;gap:18px;padding:22px 24px}
.icon-lg{font-size:30px;line-height:1}
.blog-banner h2{margin:0;font-size:17px;font-weight:700}
.blog-banner .muted{margin:4px 0 0;font-size:13px}
.metalabel{font-family:"JetBrains Mono",Consolas,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);flex:none}

/* 文章页 / 落地页公共 */
.backlink{align-self:flex-start;font-size:13px;color:var(--ink-muted)}
.post-title{margin:.35em 0 .6em;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-.01em}
.summary{margin:0;font-size:15px;line-height:1.7}
.hr-line{border:none;border-top:1px solid var(--line);margin:0}
.landing-header .top{display:flex;justify-content:space-between;align-items:flex-start}
.landing-header .icon-lg{font-size:34px}
.landing-header h1{margin:14px 0 0;font-size:24px;font-weight:700;letter-spacing:-.01em}
.landing-header .muted{margin:6px 0 0;font-size:14px}
.btn-accent{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#FAF7F2;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600}
.btn-accent .host{font-family:"JetBrains Mono",Consolas,monospace;font-size:11px;opacity:.85}
.btn-ghost{display:inline-block;background:var(--line);color:var(--ink-muted);border-radius:12px;padding:10px 20px;font-size:14px}

.prose-body{font-size:15.5px;line-height:1.85}
.prose-body h2{margin-top:2.2em;margin-bottom:.8em;font-size:1.25rem;font-weight:700}
.prose-body h3{margin-top:1.8em;margin-bottom:.6em;font-size:1.05rem;font-weight:700}
.prose-body p{margin:.9em 0}
.prose-body ul{margin:.9em 0;padding-left:1.4em;list-style:disc}
.prose-body li{margin:.35em 0}
.prose-body blockquote{margin:1.2em 0;padding:.6em 1.1em;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent);border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.prose-body a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
.prose-body code{font-family:"JetBrains Mono",Consolas,monospace;font-size:.88em;padding:.15em .45em;border-radius:var(--radius-sm);background:color-mix(in srgb,var(--ink) 5%,transparent)}
.prose-body pre{margin:1.2em 0;padding:14px 16px;border:1px solid var(--line);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--ink) 4%,transparent);overflow-x:auto;font-size:.86em;line-height:1.7}
.prose-body pre code{padding:0;background:none}
.prose-body .katex-display{overflow-x:auto;overflow-y:hidden;padding:2px 0}
.prose-body hr{margin:2em 0;border-color:var(--line)}
.profile{display:grid;gap:16px;grid-template-columns:1fr 320px}
.profile h1{margin:0;font-size:24px;font-weight:700;text-transform:capitalize}
.profile .muted{margin:10px 0 0;font-size:15px}
.profile .motto{display:flex;align-items:center}
.profile .motto p{margin:0;font-size:18px;font-weight:600}
@media(max-width:640px){.profile{grid-template-columns:1fr}}
`;

// 预览视图切换按钮（entries 用；详情页仅 kind=service 可用）
function previewTabsHtml() {
  if (currentTab !== 'entries') return '';
  return `<div class="pv-tabs" id="pv-tabs">
    <button type="button" data-pv="grid" class="on">首页网格</button>
    <button type="button" data-pv="landing">详情页</button>
  </div>`;
}

function bindPvTabs() {
  const tabs = document.getElementById('pv-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pv]');
    if (!btn || btn.disabled) return;
    pvMode = btn.dataset.pv;
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    updatePreview(SCHEMA.entries.fields);
  });
}

/** kind 非 service 时禁用「详情页」，并从 landing 弹回 grid */
function syncPvTabs(data) {
  const tabs = document.getElementById('pv-tabs');
  if (!tabs) return;
  const canLanding = data.kind === 'service';
  const landingBtn = tabs.querySelector('[data-pv="landing"]');
  landingBtn.disabled = !canLanding;
  landingBtn.title = canLanding ? '' : '仅 service 类型有站内详情页';
  if (!canLanding && pvMode === 'landing') {
    pvMode = 'grid';
    tabs.querySelector('[data-pv="grid"]').classList.add('on');
    landingBtn.classList.remove('on');
  }
}

// iframe 首次 srcdoc 加载完成后置 ready；此后每次更新只替换 body.innerHTML，
// 不重新导航 → 无闪烁、滚动位置自然保留（KaTeX CSS 在 head 中常驻不重载）
function bindPreviewFrame() {
  const frame = document.getElementById('preview-frame');
  frame.addEventListener('load', () => { frame.dataset.ready = '1'; });
}

function paintPreview(frame, bodyHtml) {
  const doc = frame.contentDocument;
  if (doc && doc.body && frame.dataset.ready === '1') {
    doc.body.innerHTML = bodyHtml;
  } else {
    frame.srcdoc = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="stylesheet" href="/vendor/katex/katex.min.css"><style>${PREVIEW_CSS}</style></head><body>${bodyHtml}</body></html>`;
  }
}

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

/** 收集当前表单值用于预览（不校验，允许空） */
function collectForPreview(fields) {
  const out = {};
  for (const f of fields) {
    const el = $modalRoot.querySelector(`[data-key="${f.key}"]`) || $main.querySelector(`[data-key="${f.key}"]`);
    if (!el) continue;
    if (f.type === 'checkbox') out[f.key] = el.checked;
    else if (f.type === 'tags') out[f.key] = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    else out[f.key] = el.value;
  }
  return out;
}

// ── 预览数据源 ──────────────────────────────────────────────
let entriesCache = null;
let postsCache = null;

async function fetchEntries() {
  if (!entriesCache) { try { entriesCache = await api('/api/entries'); } catch { entriesCache = []; } }
  return entriesCache;
}
async function fetchPostsCount() {
  if (!postsCache) { try { postsCache = await api('/api/posts'); } catch { postsCache = []; } }
  return postsCache.length;
}
async function renderMd(md) {
  try {
    const r = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ md: md || '' }) });
    return (await r.json()).html || '';
  } catch { return ''; }
}

const STATUS_LABEL = { running: '运行中', building: '构建中', archived: '已归档' };
const statusBadge = (status) =>
  status ? `<span class="badge-s"><span class="dot ${esc(status)}"></span>${STATUS_LABEL[status] ?? esc(status)}</span>` : '';

/** bento 小卡（works 区形态），所有字段可见：图标/状态徽章/标题/箭头/一句话介绍 */
function entryBentoCard(e, current) {
  const glyph = e.kind === 'external' ? '↗' : '→';
  const size = e.size_hint || 'md';
  return `<a class="card entrycard ${esc(size)}${current ? ' current' : ''}">
    <div class="top"><span class="icon">${esc(e.icon || '')}</span>${statusBadge(e.status)}</div>
    <div><h2>${esc(e.title || '')} <span class="arrow">${glyph}</span></h2><p class="muted">${esc(e.tagline || '')}</p></div>
  </a>`;
}

/** blog 分栏横幅卡（生产首页「博客」入口形态） */
function entryBlogBanner(e, postCount) {
  return `<a class="card blog-banner${e._current ? ' current' : ''}">
    <span class="icon-lg">${esc(e.icon || '')}</span>
    <div style="flex:1;min-width:0">
      <h2>${esc(e.title || '')} <span class="arrow">→</span></h2>
      <p class="muted">${esc(e.tagline || '')} · 共 ${postCount} 篇</p>
    </div>
    <span class="metalabel">writing</span>
  </a>`;
}

/**
 * 首页网格实况：按当前编辑卡的 section 渲染对应分区，
 * 把表单里的实时值替换进真实卡片序列并高亮（与生产 index.astro 同构）：
 * - blog：单张横幅卡（文章数取自 posts 列表）
 * - works：bento 密集网格，size_hint 决定尺寸，lg 跨两行
 * - services：两列网格且强制 md 尺寸
 */
async function buildEntriesGrid(data) {
  const all = await fetchEntries();
  const sec = data.section || (data.kind === 'internal' ? 'blog' : 'works');
  const sectionOf = (e) => e.section ?? (e.kind === 'internal' ? 'blog' : 'works');

  if (sec === 'blog') {
    const count = await fetchPostsCount();
    return `<div class="stack">${entryBlogBanner({ ...data, _current: true }, count)}</div>`;
  }

  // 同区可见卡为背景板（当前卡即使不可见也显示，便于预览公开后的效果）
  const peers = all.filter((e) => sectionOf(e) === sec && (e.visible || e.id === data.id));
  const idx = peers.findIndex((e) => e.id === data.id);
  if (idx >= 0) peers[idx] = { ...data, _current: true };
  else peers.push({ ...data, _current: true });

  if (sec === 'services') {
    return `<div class="svc-grid">${peers.map((e) => entryBentoCard({ ...e, size_hint: 'md' }, e._current)).join('')}</div>`;
  }
  return `<div class="bento">${peers.map((e) => entryBentoCard(e, e._current)).join('')}</div>`;
}

/** 详情落地页（生产 /s/[id].astro 同构）：header 卡 + 正文 + 底部按钮双态 */
function buildLanding(data, landingHtml) {
  const btn = data.external_url
    ? (() => {
        let host = data.external_url;
        try { host = new URL(data.external_url).host; } catch { /* 未写完整 URL 时原样展示 */ }
        return `<a class="btn-accent">访问 ↗ <span class="host">${esc(host)}</span></a>`;
      })()
    : `<span class="btn-ghost">${data.status === 'building' ? '构建中 · 尚未上线' : '自用工具 · 未公开访问'}</span>`;
  return `<div class="stack">
    <a class="backlink">← 返回主站</a>
    <header class="card landing-header">
      <div class="top"><span class="icon-lg">${esc(data.icon || '')}</span>${statusBadge(data.status)}</div>
      <h1>${esc(data.title || '')}</h1>
      ${data.tagline ? `<p class="muted">${esc(data.tagline)}</p>` : ''}
    </header>
    <article class="prose-body">${landingHtml || '<p class="muted">（正文为空）</p>'}</article>
    <div class="btn-row">${btn}</div>
  </div>`;
}

/** 文章页（生产 posts/[slug].astro 同构）：meta 行 + H1 + 摘要 + 分割线 + 正文 */
function buildPostPage(data, contentHtml) {
  const date = data.published_at ? new Date(data.published_at).toLocaleDateString('zh-CN') : '';
  const tags = Array.isArray(data.tags) ? data.tags.join(' / ') : '';
  return `<div class="stack">
    <a class="backlink">← 全部文章</a>
    <header>
      <div class="meta"><time>${date}</time><span>·</span><span class="mono">${esc(tags)}</span></div>
      <h1 class="post-title">${esc(data.title || '')}</h1>
      <p class="muted summary">${esc(data.summary || '')}</p>
    </header>
    <hr class="hr-line" />
    <article class="prose-body">${contentHtml || '<p class="muted">（正文为空）</p>'}</article>
  </div>`;
}

function buildProfilePage(data) {
  return `<section class="profile"><div class="card"><h1>${esc(data.name || '')}</h1><p class="muted">${esc(data.intro || '')}</p></div><div class="card motto"><p>${esc(data.motto || '')}</p></div></section>`;
}

async function updatePreview(fields) {
  const frame = document.getElementById('preview-frame');
  if (!frame) return;
  const data = collectForPreview(fields);
  syncPvTabs(data);

  let bodyHtml = '';
  if (currentTab === 'profile') {
    bodyHtml = buildProfilePage(data);
  } else if (currentTab === 'posts') {
    bodyHtml = buildPostPage(data, await renderMd(data.content_md));
  } else if (pvMode === 'landing') {
    bodyHtml = buildLanding(data, await renderMd(data.landing_description_md));
  } else {
    bodyHtml = await buildEntriesGrid(data);
  }
  paintPreview(frame, bodyHtml);
}

// ── 编辑模态 ────────────────────────────────────────────────
function openModal(spec, row) {
  const isEdit = !!row;
  const fields = spec.fields.map((f) => (f.readOnlyOnEdit && isEdit ? { ...f, disabled: true } : f));
  // 新建时应用 schema 默认值（如 published_at 默认当前时间）
  const seedRow = isEdit
    ? row
    : Object.fromEntries(spec.fields.filter((f) => f.defaultNow).map((f) => [f.key, new Date().toISOString()]));

  $modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal wide">
        <h3>${isEdit ? '编辑' : '新建'}${spec.label}</h3>
        <div class="modal-body">
          <div class="modal-form">${buildFields(fields, seedRow)}</div>
          <aside class="preview-pane">
            <div class="preview-label">实时预览</div>
            ${previewTabsHtml()}
            <iframe id="preview-frame" title="预览"></iframe>
          </aside>
        </div>
        <div class="modal-footer">
          <button class="btn" id="cancel-btn">取消</button>
          <button class="btn primary" id="save-btn">${isEdit ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>`;

  let dirty = false;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    $modalRoot.innerHTML = '';
  };
  const tryClose = () => {
    if (dirty && !confirm('有未保存的修改，确定丢弃并关闭？')) return;
    close();
  };
  const onKey = (e) => { if (e.key === 'Escape') tryClose(); };
  document.addEventListener('keydown', onKey);

  document.getElementById('cancel-btn').addEventListener('click', tryClose);
  $modalRoot.querySelector('.modal-overlay').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) tryClose(); });

  bindPreviewFrame();
  bindPvTabs();
  const schedulePreview = debounce(() => updatePreview(fields), 250);
  updatePreview(fields);
  $modalRoot.addEventListener('input', () => { dirty = true; schedulePreview(); });

  document.getElementById('save-btn').addEventListener('click', async () => {
    let payload;
    try { payload = collect(fields); } catch (e) { toast(e.message, true); return; }
    try {
      if (isEdit) await api(`/api/${currentTab}/${encodeURIComponent(row[spec.key])}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api(`/api/${currentTab}`, { method: 'POST', body: JSON.stringify(payload) });
      dirty = false;
      toast(isEdit ? '已保存' : '已创建');
      close();
      render();
    } catch (e) { toast(e.message, true); }
  });
}

// ── tab 切换 ────────────────────────────────────────────────
$tabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  currentTab = btn.dataset.tab;
  $tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
  render();
});

render();
