ALTER TABLE public.clan_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- NOTE:
-- Backfill to approved is intentionally omitted here.
-- The canonical migration (20260402015257_...) already performs the one-time backfill.
-- Repeating a global approval update in this follow-up migration can auto-approve
-- legitimate pending join requests in environments where migrations are applied at
-- different times.

UPDATE public.clan_memberships cm
SET role = 'captain'
FROM public.app_clans c
WHERE cm.clan_id = c.id
  AND cm.user_id = c.created_by::uuid;
