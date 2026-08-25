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
      { key: 'published_at', label: '发布时间', type: 'datetime', required: true },
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
      { key: 'landing_description_md', label: '详情页正文 Markdown', type: 'textarea', large: true, prose: true, nullable: true, full: true, hint: 'service 类型专用' },
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
    input = `<div class="check-row"><input type="checkbox" data-key="${f.key}" ${val ? 'checked' : ''} /><span class="hint">${f.hint || ''}</span></div>`;
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
// 预览 iframe 内复刻生产站设计令牌 + 卡片 + prose 排版，保证与线上一致
const PREVIEW_CSS = `
:root{--bg:#FAF7F2;--surface:#FFFFFF;--ink:#1C1917;--ink-muted:#78716C;--line:#E7E0D8;--line-strong:#D9CFC2;--accent:#B45309;--radius-card:16px;--radius-sm:10px;--shadow-rest:0 1px 2px rgb(28 25 23/0.05),0 4px 12px rgb(28 25 23/0.06)}
*{box-sizing:border-box}
body{margin:0;padding:20px;background:var(--bg);color:var(--ink);font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.7;font-size:15px}
.stack{display:flex;flex-direction:column;gap:16px;max-width:68ch}
.card{background:var(--surface);border-radius:var(--radius-card);box-shadow:var(--shadow-rest);border:1px solid var(--line);padding:24px}
.muted{color:var(--ink-muted)}
.mono{font-family:"JetBrains Mono",Consolas,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.meta{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--ink-muted)}
.postcard h2,.entrycard h2{margin:10px 0 0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.postcard .clamp{margin:8px 0 0;font-size:13.5px}
.entrycard .top{display:flex;justify-content:space-between;align-items:flex-start}
.entrycard .icon{font-size:26px;line-height:1}
.entrycard .muted{margin-top:6px;font-size:13.5px}
.entrycard.sm{padding:20px}.entrycard.lg{padding:28px}.entrycard.lg h2{font-size:20px}
.arrow{display:inline-block;transition:transform .2s}
.entrycard:hover .arrow{transform:translateX(4px);color:var(--accent)}
.dot{width:8px;height:8px;border-radius:9999px;display:inline-block}
.dot.running{background:#16A34A}.dot.building{background:#D97706}.dot.archived{background:#A8A29E}
.profile{display:grid;gap:16px;grid-template-columns:1fr 320px}
.profile h1{margin:0;font-size:24px;font-weight:700;text-transform:capitalize}
.profile .muted{margin:10px 0 0;font-size:15px}
.profile .motto{display:flex;align-items:center}
.profile .motto p{margin:0;font-size:18px;font-weight:600}
@media(max-width:640px){.profile{grid-template-columns:1fr}}
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
`;

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

function buildPreviewBody(data, renderedHtml) {
  if (currentTab === 'profile') {
    return `<section class="profile"><div class="card"><h1>${esc(data.name || '')}</h1><p class="muted">${esc(data.intro || '')}</p></div><div class="card motto"><p>${esc(data.motto || '')}</p></div></section>`;
  }
  if (currentTab === 'posts') {
    const date = data.published_at ? new Date(data.published_at).toLocaleDateString('zh-CN') : '';
    return `<div class="stack">
      <div class="card postcard"><div class="meta"><span>${date}</span><span>·</span><span class="mono">${esc((data.tags || []).join(' / '))}</span></div><h2>${esc(data.title || '')} <span class="arrow">→</span></h2><p class="muted clamp">${esc(data.summary || '')}</p></div>
      <article class="prose-body">${renderedHtml || ''}</article>
    </div>`;
  }
  const glyph = data.kind === 'external' ? '↗' : '→';
  const status = data.status || '';
  return `<div class="stack"><a class="card entrycard ${esc(data.size_hint || 'md')}">
    <div class="top"><span class="icon">${esc(data.icon || '')}</span>${status ? `<span class="dot ${esc(status)}"></span>` : ''}</div>
    <div><h2>${esc(data.title || '')} <span class="arrow">${glyph}</span></h2>${data.tagline ? `<p class="muted">${esc(data.tagline)}</p>` : ''}</div>
  </a></div>`;
}

function buildPreviewShell(data, renderedHtml) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="stylesheet" href="/vendor/katex/katex.min.css"><style>${PREVIEW_CSS}</style></head><body>${buildPreviewBody(data, renderedHtml)}</body></html>`;
}

async function updatePreview(fields) {
  const frame = document.getElementById('preview-frame');
  if (!frame) return;
  const data = collectForPreview(fields);
  let html = '';
  if (currentTab === 'posts') {
    try {
      const r = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ md: data.content_md || '' }) });
      html = (await r.json()).html || '';
    } catch { /* 渲染失败时正文留空 */ }
  }
  frame.srcdoc = buildPreviewShell(data, html);
}

// ── 编辑模态 ────────────────────────────────────────────────
function openModal(spec, row) {
  const isEdit = !!row;
  const fields = spec.fields.map((f) => (f.readOnlyOnEdit && isEdit ? { ...f, disabled: true } : f));
  $modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal wide">
        <h3>${isEdit ? '编辑' : '新建'}${spec.label}</h3>
        <div class="modal-body">
          <div class="modal-form">${buildFields(fields, row)}</div>
          <aside class="preview-pane">
            <div class="preview-label">实时预览</div>
            <iframe id="preview-frame" title="预览"></iframe>
          </aside>
        </div>
        <div class="modal-footer">
          <button class="btn" id="cancel-btn">取消</button>
          <button class="btn primary" id="save-btn">${isEdit ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>`;

  const close = () => ($modalRoot.innerHTML = '');
  document.getElementById('cancel-btn').addEventListener('click', close);
  $modalRoot.querySelector('.modal-overlay').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) close(); });

  const schedulePreview = debounce(() => updatePreview(fields), 250);
  updatePreview(fields);
  $modalRoot.addEventListener('input', schedulePreview);

  document.getElementById('save-btn').addEventListener('click', async () => {
    let payload;
    try { payload = collect(fields); } catch (e) { toast(e.message, true); return; }
    try {
      if (isEdit) await api(`/api/${currentTab}/${encodeURIComponent(row[spec.key])}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api(`/api/${currentTab}`, { method: 'POST', body: JSON.stringify(payload) });
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
