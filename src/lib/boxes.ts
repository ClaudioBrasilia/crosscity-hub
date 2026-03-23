import { supabase } from '@/integrations/supabase/client';

export interface BoxRecord {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  member_count: number;
  points: number;
  created_at: string;
  updated_at: string;
}

const BOXES_CACHE_KEY = 'crosscity_boxes_cache';

export const readBoxesCache = (): BoxRecord[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(BOXES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeBoxesCache = (boxes: BoxRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BOXES_CACHE_KEY, JSON.stringify(boxes));
};

export async function fetchBoxes() {
  const { data, error } = await supabase
    .from('boxes' as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const boxes = (data || []) as BoxRecord[];
  writeBoxesCache(boxes);
  return boxes;
}

export async function createBox(name: string) {
  const { data, error } = await supabase.rpc('create_box' as any, { p_name: name });

  if (error) throw error;
  return data as BoxRecord;
}

export async function joinBoxByCode(inviteCode: string) {
  const { data, error } = await supabase.rpc('join_box_by_code' as any, { p_invite_code: inviteCode });

  if (error) throw error;
  return data as BoxRecord;
}
