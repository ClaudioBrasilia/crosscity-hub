ALTER TABLE public.clan_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

UPDATE public.clan_memberships
SET status = 'approved';

UPDATE public.clan_memberships cm
SET role = 'captain'
FROM public.app_clans c
WHERE cm.clan_id = c.id
  AND cm.user_id = c.created_by::uuid;
