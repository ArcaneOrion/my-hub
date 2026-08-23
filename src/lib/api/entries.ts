import type { Entry } from '../types';
import { supabase } from '../supabase';
import { mockEntries } from '../mock-data';

/** 入口卡数据访问层。Supabase 不可用时回退 mock（离线开发）。 */
export async function getEntries(): Promise<Entry[]> {
  if (!supabase) return mockEntries.filter((e) => e.visible !== false).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('visible', true)
    .order('sort', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getServiceEntry(id: string): Promise<Entry | undefined> {
  const entries = await getEntries();
  return entries.find(
    (e) => e.id === id && e.kind === 'service' && !!e.landing_description_md,
  );
}
