import { supabase } from '@/integrations/supabase/client';

export type TvLayoutModel = 'old' | 'new';
export type TvRightTopBlockMode = 'checkins' | 'avatar';

export const getTvLayoutModel = async (): Promise<TvLayoutModel> => {
  const { data, error } = await (supabase as any)
    .from('training_locations')
    .select('tv_layout_model')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) return 'old';
  return data?.tv_layout_model === 'new' ? 'new' : 'old';
};

export const getTvRightTopBlockMode = async (): Promise<TvRightTopBlockMode> => {
  const { data, error } = await (supabase as any)
    .from('training_locations')
    .select('tv_right_top_block_mode')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) return 'checkins';
  return data?.tv_right_top_block_mode === 'avatar' || data?.tv_right_top_block_mode === 'avatars' ? 'avatar' : 'checkins';
};

export const updateTvLayoutModel = async (locationId: string, model: TvLayoutModel) => {
  return (supabase as any)
    .from('training_locations')
    .update({ tv_layout_model: model })
    .eq('id', locationId)
    .select('*')
    .maybeSingle();
};
