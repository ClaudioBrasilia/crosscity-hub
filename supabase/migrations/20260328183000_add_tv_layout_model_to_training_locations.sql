alter table public.training_locations
  add column if not exists tv_layout_model text not null default 'old';

alter table public.training_locations
  drop constraint if exists training_locations_tv_layout_model_check;

alter table public.training_locations
  add constraint training_locations_tv_layout_model_check
  check (tv_layout_model in ('old', 'new'));
