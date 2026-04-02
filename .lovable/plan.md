

## Plan: Fix "Falha ao criar liderança do time" Error

### Root Cause
The code in `supabaseData.ts` inserts `status: 'approved'` into `clan_memberships`, but the `status` column does not exist on that table yet. The database schema shows `clan_memberships` only has: `id`, `user_id`, `clan_id`, `role`, `joined_at`.

### Fix

**1. Database Migration** — Add the missing `status` column:

```sql
ALTER TABLE public.clan_memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Backfill existing memberships as approved
UPDATE public.clan_memberships SET status = 'approved';

-- Ensure creators are captains
UPDATE public.clan_memberships cm
SET role = 'captain'
FROM public.app_clans c
WHERE cm.clan_id = c.id AND cm.user_id = c.created_by;
```

**2. Update RLS** — The existing UPDATE policy uses `auth.uid() = user_id OR has_role(...)`. We need to also allow captains to update members in their clan (for approving/removing):

```sql
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
```

**3. No code changes needed** — The TypeScript code already references `status` with `as any` casts, so once the column exists, everything will work.

### Files changed
| File | Change |
|------|--------|
| Migration SQL | Add `status` column, backfill, update RLS policies |

### What stays untouched
TV, check-in, WOD, ranking, duels, challenges — no changes.

