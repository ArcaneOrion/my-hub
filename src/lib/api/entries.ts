import type { Entry } from '../types';
import { mockEntries } from '../mock-data';

/** 入口卡数据访问层。M2 切换 Supabase：GET /entries?visible=true&order=sort.asc */
export async function getEntries(): Promise<Entry[]> {
  return mockEntries.filter((e) => e.visible !== false).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
}

export async function getServiceEntry(id: string): Promise<Entry | undefined> {
  const entries = await getEntries();
  return entries.find(
    (e) => e.id === id && e.kind === 'service' && !!e.landing_description_md,
  );
}
