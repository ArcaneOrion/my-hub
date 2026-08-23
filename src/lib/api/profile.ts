import type { Profile } from '../types';
import { supabase } from '../supabase';
import { mockProfile } from '../mock-data';

/** 身份块数据访问层。Supabase 不可用时回退 mock（离线开发）。 */
export async function getProfile(): Promise<Profile> {
  if (!supabase) return mockProfile;
  const { data, error } = await supabase.from('profile').select('name,intro,motto').eq('id', 1).single();
  if (error) throw error;
  return data;
}
