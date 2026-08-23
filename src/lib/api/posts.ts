import type { Post, PostMeta } from '../types';
import { mockPosts } from '../mock-data';

/**
 * 文章数据访问层。M1 返回 mock 数据；M2 起改从 Supabase PostgREST 读取，
 * 函数签名不变，页面层无感切换。所有查询必须过滤 visibility='public'。
 */

const byNewest = (a: { published_at: string }, b: { published_at: string }) =>
  b.published_at.localeCompare(a.published_at);

export async function getPostMetas(): Promise<PostMeta[]> {
  // TODO(M2): GET /rest/v1/posts?visibility=eq.public&order=published_at.desc&select=<meta fields>
  return mockPosts.map(({ content_md: _md, ...meta }) => meta).sort(byNewest);
}

export async function getFeaturedPosts(limit = 4): Promise<PostMeta[]> {
  const all = await getPostMetas();
  return all.filter((p) => p.featured).slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  // TODO(M2): GET /rest/v1/posts?slug=eq.<slug>&visibility=eq.public
  return mockPosts.find((p) => p.slug === slug);
}

export async function getAllSlugs(): Promise<string[]> {
  return (await getPostMetas()).map((p) => p.slug);
}
