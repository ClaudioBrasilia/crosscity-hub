
-- Add status column to clan_memberships
ALTER TABLE public.clan_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Backfill existing memberships as approved
UPDATE public.clan_memberships SET status = 'approved';

-- Ensure creators are captains
UPDATE public.clan_memberships cm
SET role = 'captain'
FROM public.app_clans c
WHERE cm.clan_id = c.id AND cm.user_id = c.created_by::uuid;

-- Update RLS: allow captains to update members in their clan
DROP POLICY IF EXISTS "Users can update own membership" ON public.clan_memberships;
CREATE POLICY "Users or captains can update membership"
  ON public.clan_memberships FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.clan_memberships cap
      WHERE cap.clan_id = clan_memberships.clan_id
        AND cap.user_id = auth.uid()
        AND cap.role = 'captain'
        AND cap.status = 'approved'
    )
  );

-- Update RLS: allow captains to delete members
DROP POLICY IF EXISTS "Users can leave or admin can manage" ON public.clan_memberships;
CREATE POLICY "Users captains or admins can delete membership"
  ON public.clan_memberships FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.clan_memberships cap
      WHERE cap.clan_id = clan_memberships.clan_id
        AND cap.user_id = auth.uid()
        AND cap.role = 'captain'
        AND cap.status = 'approved'
    )
  );
