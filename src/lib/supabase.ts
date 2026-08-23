import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端单例。全项目唯一创建 client 的地方（lib/api/* 由此导入）。
 * 环境变量缺失时返回 null —— lib/api 层据此回退到 mock 数据，保证离线可开发。
 */
const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
