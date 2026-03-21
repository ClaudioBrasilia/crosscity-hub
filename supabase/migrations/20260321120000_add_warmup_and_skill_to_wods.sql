alter table if exists public.wods
  add column if not exists warmup text,
  add column if not exists skill text;
