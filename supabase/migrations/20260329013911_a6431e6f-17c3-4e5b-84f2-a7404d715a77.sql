ALTER TABLE public.training_locations
ADD COLUMN IF NOT EXISTS tv_layout_model text DEFAULT 'old';