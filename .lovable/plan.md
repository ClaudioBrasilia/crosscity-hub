

## Plan: Fix TvMode.tsx Build Errors

### Problem
The file has duplicate declarations from a previous incomplete merge — two copies of `timeParts`, two copies of `loadTvData`, an unused `useRef`, and unused modular load functions.

### Fix

**File: `src/pages/TvMode.tsx`**

1. **Remove lines 185-352** — This block contains:
   - `refreshTimersRef` (uses `useRef` but is never consumed)
   - First `timeParts` declaration (duplicate of line 354)
   - Modular load functions (`loadHeaderAndWorkout`, `loadChallenges`, `loadCheckins`, `loadMonthlyAndFrequency`, `loadDuels`, `loadResults`) — all dead code, superseded by the monolithic `loadTvData` at line 356
   - First `loadTvData` (lines 327-341) — duplicate of line 356
   - `scheduleRefresh` — never called anywhere

2. The second `timeParts` (line 354) and second `loadTvData` (line 356) remain as the working versions.

3. No import changes needed — `useRef` was only used by the removed code.

### Result
All 5 build errors resolved. No functionality changes — the kept code is identical to what was actually running.

| File | Change |
|------|--------|
| `src/pages/TvMode.tsx` | Remove duplicate/dead code block (lines 185-352) |

