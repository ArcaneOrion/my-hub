/** 与 specs/openapi.yaml 对应的接口形状（M2 起由 openapi-typescript 生成本文件，当前手写对齐） */

export type EntryKind = 'internal' | 'service' | 'external';
export type EntryStatus = 'running' | 'building' | 'archived';
export type SizeHint = 'sm' | 'md' | 'lg';
/** 首页分栏：博客独栏 / 作品 / 服务 */
export type EntrySection = 'blog' | 'works' | 'services';

export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  tagline?: string | null;
  icon?: string | null;
  accent?: string | null;
  size_hint?: SizeHint;
  sort?: number;
  visible?: boolean;
  section?: EntrySection;
  landing_description_md?: string | null;
  status?: EntryStatus | null;
  external_url?: string | null;
}

export interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  featured: boolean;
  published_at: string; // ISO date-time
}

export interface Post extends PostMeta {
  content_md: string;
  updated_at?: string;
}

export interface Profile {
  name: string;
  intro: string;
  motto: string;
}
