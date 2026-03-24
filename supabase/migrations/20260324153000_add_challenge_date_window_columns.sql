-- Minimal/safe support for challenge validity window on existing environments.
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Keep legacy rows compatible during rollout.
ALTER TABLE public.challenges
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'challenges_date_window_valid'
      AND conrelid = 'public.challenges'::regclass
  ) THEN
    ALTER TABLE public.challenges
      ADD CONSTRAINT challenges_date_window_valid
      CHECK (
        start_date IS NULL
        OR end_date IS NULL
        OR start_date <= end_date
      );
  END IF;
END $$;
