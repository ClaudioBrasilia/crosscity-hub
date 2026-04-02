

## Plan: Fix Build Errors + Challenge Once-Per-Day Limit

### Build Errors to Fix

**1. `src/pages/TvMode.tsx`** — Duplicate `loadTvData` declaration and missing `refreshFromRealtime`:
- Remove the duplicate `loadTvData` block (lines 302-324, exact copy of 278-300).
- Define `refreshFromRealtime` as a function that calls the `load` function or `loadTvData`. The real-time channels reference it but it's never defined.

**2. `src/pages/Admin.tsx`** — Two errors in the economy settings:
- Line 555: `updateAvatarEconomySettings` expects 2 args (`currentId`, `payload`). Fix to pass `form.id` and the update payload separately.
- Line 589: `handleResetDefaults` sets form without `id`, `rule_labels`, `rule_notes`, `created_at`. Spread existing form values to keep those fields.

### Challenge Once-Per-Day Feature

**3. `src/lib/supabaseData.ts`** — Modify `incrementChallengeProgress` to check if user already incremented today:
- Query `challenge_progress` for `updated_at` — if it's today, throw an error / return early with a message.
- Only allow the increment if the last update was before today (comparing dates in the user's timezone).

**4. `src/pages/Challenges.tsx`** — Disable the increment button if already done today:
- Track per-challenge "already incremented today" state based on the `updated_at` field from `challenge_progress`.
- Show the button as disabled with a label like "Já registrado hoje" when the user has already incremented.
- On error from the backend (already incremented), show a toast message.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/TvMode.tsx` | Remove duplicate `loadTvData`, add `refreshFromRealtime` |
| `src/pages/Admin.tsx` | Fix `updateAvatarEconomySettings` call signature, fix `handleResetDefaults` |
| `src/lib/supabaseData.ts` | Add daily check to `incrementChallengeProgress` |
| `src/pages/Challenges.tsx` | Disable increment button if already used today |

### What stays untouched
TV layout, check-in, WOD, ranking, duels, clans — no changes.

