import type { Post, PostMeta } from '../types';
import { supabase } from '../supabase';
import { mockPosts } from '../mock-data';

/**
 * 文章数据访问层。Supabase 不可用时回退 mock（离线开发）。
 * 所有查询强制 visibility='public'。
 */

const META_FIELDS = 'slug,title,summary,tags,featured,published_at';
const byNewest = (a: { published_at: string }, b: { published_at: string }) =>
  b.published_at.localeCompare(a.published_at);

export async function getPostMetas(): Promise<PostMeta[]> {
  if (!supabase) return mockPosts.map(({ content_md: _md, ...meta }) => meta).sort(byNewest);
  const { data, error } = await supabase
    .from('posts')
    .select(META_FIELDS)
    .eq('visibility', 'public')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFeaturedPosts(limit = 4): Promise<PostMeta[]> {
  if (!supabase) {
    const all = await getPostMetas();
    return all.filter((p) => p.featured).slice(0, limit);
  }
  const { data, error } = await supabase
    .from('posts')
    .select(META_FIELDS)
    .eq('visibility', 'public')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (!supabase) return mockPosts.find((p) => p.slug === slug);
  const { data, error } = await supabase
    .from('posts')
    .select(`${META_FIELDS},content_md,updated_at`)
    .eq('slug', slug)
    .eq('visibility', 'public')
    .maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function getAllSlugs(): Promise<string[]> {
  return (await getPostMetas()).map((p) => p.slug);
}
