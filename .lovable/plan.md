

## Plan: Add "Leave Team" + Admin "Delete Team"

### Overview
Two features: (1) any member can leave their current team, and (2) app admins can delete teams from the Admin page.

### Changes

**1. `src/lib/supabaseData.ts`** — Add two functions:
- `leaveClan(userId, clanId)` — deletes the user's own membership row (RLS already allows `auth.uid() = user_id` for DELETE).
- `deleteClan(clanId)` — deletes all memberships for the clan, then deletes the clan itself. Requires admin role (RLS on `app_clans` currently blocks DELETE, so we need a migration).

**2. Database Migration** — Add DELETE policy on `app_clans`:
```sql
CREATE POLICY "Admins can delete clans"
  ON public.app_clans FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Also allow admin to delete all memberships of a clan
-- (already covered by existing "Users captains or admins can delete membership" policy)
```

**3. `src/pages/Clans.tsx`** — Add "Sair do Time" button:
- Visible when user has `myClan` and is NOT the sole captain.
- Calls `leaveClan(user.id, clanId)`, shows toast, refreshes via `setTick`.
- If user is captain, show warning that they must transfer captaincy or the team will lose its captain.

**4. `src/pages/Admin.tsx`** — Add "Gerenciar Times" section:
- Fetch all clans with `getClans()` and member counts.
- Display list with clan name, member count, and a "Excluir" (Delete) button.
- On click, confirm with `window.confirm()`, then call `deleteClan(clanId)`.

### What stays untouched
TV, check-in, WOD, ranking, duels, challenges — no changes.

### Files changed
| File | Change |
|------|--------|
| Migration SQL | Add DELETE policy on `app_clans` for admins |
| `src/lib/supabaseData.ts` | Add `leaveClan` and `deleteClan` functions |
| `src/pages/Clans.tsx` | Add "Sair do Time" button |
| `src/pages/Admin.tsx` | Add team management section with delete |

