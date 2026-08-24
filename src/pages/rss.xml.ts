import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostMetas } from '../lib/api/posts';
import { SITE } from '../lib/config';

/** RSS 订阅源：/rss.xml —— 读者用任意 RSS 阅读器订阅本站更新 */
export async function GET(context: APIContext) {
  const posts = await getPostMetas();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      description: p.summary,
      link: `/posts/${p.slug}/`, // @astrojs/rss 默认 trailingSlash:true，与 sitemap/服务 URL 一致
      pubDate: new Date(p.published_at),
      categories: p.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
