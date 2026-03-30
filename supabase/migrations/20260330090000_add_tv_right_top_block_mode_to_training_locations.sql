alter table public.training_locations
add column if not exists tv_right_top_block_mode text not null default 'checkins';

update public.training_locations
set tv_right_top_block_mode = 'checkins'
where tv_right_top_block_mode is null;
