

## Plan: Create `class_schedules` Table

### Root Cause
The `class_schedules` table does not exist in the database. The Admin page and TV mode both reference it, causing errors when trying to add, list, or filter by class schedules.

### Fix

**Database Migration** -- Create the `class_schedules` table with RLS policies:

```sql
CREATE TABLE public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view schedules
CREATE POLICY "Anyone can view schedules"
  ON public.class_schedules FOR SELECT
  TO authenticated USING (true);

-- Admins can manage schedules (insert, update, delete)
CREATE POLICY "Admins can manage schedules"
  ON public.class_schedules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anon can view (for TV mode which uses anon key)
CREATE POLICY "Anon can view schedules"
  ON public.class_schedules FOR SELECT
  TO anon USING (true);
```

### No code changes needed
The existing code in `Admin.tsx` and `TvMode.tsx` already uses the correct column names (`start_time`, `end_time`, `label`, `is_active`). Once the table exists, everything will work.

### Files changed
| File | Change |
|------|--------|
| Migration SQL | Create `class_schedules` table with RLS |

