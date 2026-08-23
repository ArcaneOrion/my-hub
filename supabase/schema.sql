-- my-hub Supabase 初始表结构（版本化 DDL）
-- 在 Supabase Studio SQL Editor 中执行本文件完成建表。
-- v1 只需公开读：RLS 开放 anon select；写操作走 Studio（service role），不开放。

-- ── entries：主站入口卡（博客本身也是一条 entry）──────────────
create table if not exists public.entries (
  id          text primary key,
  kind        text not null check (kind in ('internal','service','external')),
  title       text not null,
  tagline     text,
  icon        text,
  accent      text,
  size_hint   text not null default 'md' check (size_hint in ('sm','md','lg')),
  sort        int  not null default 100,
  visible     bool not null default true,
  landing_description_md text,
  status      text check (status in ('running','building','archived')),
  external_url text,
  created_at  timestamptz not null default now()
);

-- ── posts：博客文章 ──────────────────────────────────────────
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  summary      text not null,
  content_md   text not null,
  tags         text[] not null default '{}',
  featured     bool not null default false,
  visibility   text not null default 'public'
               check (visibility in ('public','unlisted','members')),
  published_at timestamptz not null,
  updated_at   timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (published_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

-- ── profile：身份块（单行）────────────────────────────────────
create table if not exists public.profile (
  id     int primary key default 1 check (id = 1),
  name   text not null,
  intro  text not null,
  motto  text not null
);

-- ── RLS：匿名可读 ────────────────────────────────────────────
alter table public.entries enable row level security;
alter table public.posts   enable row level security;
alter table public.profile enable row level security;

create policy "entries_public_read" on public.entries
  for select to anon using (visible = true);

create policy "posts_public_read" on public.posts
  for select to anon using (visibility = 'public');

create policy "profile_public_read" on public.profile
  for select to anon using (true);
