-- Enforce one daily domination energy/check-in event per user/source on America/Sao_Paulo day
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, source, ((created_at AT TIME ZONE 'America/Sao_Paulo')::date)
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.domination_events
  WHERE source IN ('checkin', 'event')
)
DELETE FROM public.domination_events d
USING ranked r
WHERE d.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_domination_events_user_source_day_sp
  ON public.domination_events (
    user_id,
    source,
    ((created_at AT TIME ZONE 'America/Sao_Paulo')::date)
  )
  WHERE source IN ('checkin', 'event');
