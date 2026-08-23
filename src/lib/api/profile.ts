import type { Profile } from '../types';
import { mockProfile } from '../mock-data';

/** 身份块数据访问层。M2 切换 Supabase：GET /profile */
export async function getProfile(): Promise<Profile> {
  return mockProfile;
}
