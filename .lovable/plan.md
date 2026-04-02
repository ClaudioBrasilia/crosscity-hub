

## Plan: Fix "domination_events_battle_id_fkey" Error

### Root Cause
The `domination_events` table has a foreign key (`battle_id`) referencing `territory_battles(id)`. The code sets `battle_id` to the current day key (e.g., "2026-04-02"), but no matching row exists in `territory_battles` for that day. The insert fails with a FK violation.

### Fix

**File: `src/components/DominationEnergyButton.tsx`** — Before inserting into `domination_events`, ensure a `territory_battles` row exists for today:

1. After computing `battleId = dayKey`, query `territory_battles` for that ID.
2. If no row exists, insert one with the day's territory info (using `upsert` or insert with `ON CONFLICT DO NOTHING`).
3. Then proceed with the `domination_events` insert as before.

The upsert will create a battle record like:
```ts
await supabase.from('territory_battles').upsert({
  id: battleId,
  territory_id: 'default',
  period: 'daily',
  starts_at: dayStart,
  ends_at: dayEnd,
  energy_by_clan: {},
}, { onConflict: 'id' });
```

This also fixes the duplicate energy issue — the existing code already checks for `23505` (unique violation), but the FK error was thrown first, masking it.

### Files changed
| File | Change |
|------|--------|
| `DominationEnergyButton.tsx` | Add upsert of `territory_battles` row before inserting energy event |

### What stays untouched
TV, check-in, WOD, ranking, duels, challenges — no changes.

