-- Minimal visual progression seed for avatar shop
-- Uses existing avatar_items structure and rarity field.

insert into public.avatar_items (name, category, rarity, slot, price_coins, is_active)
select seed.name, seed.category, seed.rarity, seed.slot, seed.price_coins, true
from (
  values
    ('Regata Rare', 'upper', 'rare', 'equipped_top', 55),
    ('Shorts Rare', 'lower', 'rare', 'equipped_bottom', 55),
    ('Tênis Rare', 'footwear', 'rare', 'equipped_shoes', 65),
    ('Headband Rare', 'head', 'rare', 'equipped_head_accessory', 70),
    ('Camiseta Epic', 'upper', 'epic', 'equipped_top', 95),
    ('Calça Epic', 'lower', 'epic', 'equipped_bottom', 95),
    ('Tênis Epic', 'footwear', 'epic', 'equipped_shoes', 110),
    ('Aura Epic', 'special', 'epic', 'equipped_special', 140)
) as seed(name, category, rarity, slot, price_coins)
where not exists (
  select 1
  from public.avatar_items ai
  where ai.name = seed.name
    and ai.slot = seed.slot
);
