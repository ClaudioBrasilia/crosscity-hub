

## Plan: Add "Join Team" functionality to the Clans page

### Problem
Currently users can only create a new team. There is no UI to join an existing team. The `joinClan` function already exists in `supabaseData.ts` but is only called when creating a new clan.

### Changes

**File: `src/pages/Clans.tsx`** (single file change)

1. In the "Sem Time" section (lines 131-139), add a "Join Team" button alongside the existing "Criar Meu Time" button.

2. Add a Dialog that lists all existing clans (already loaded in `clans` state) with member count and motto, each with a "Entrar" button.

3. On click, call the existing `joinClan(user.id, clan.id)` function, show a success toast, and refresh state via `setTick`.

4. If user already has a team (`myClan` is set), hide the join option (already handled by the existing conditional).

### No other files or database changes needed
- `joinClan()` already exists in `supabaseData.ts`
- `clan_memberships` table has RLS allowing users to insert their own membership
- No changes to TV, check-in, WOD, ranking, duels, or challenges

