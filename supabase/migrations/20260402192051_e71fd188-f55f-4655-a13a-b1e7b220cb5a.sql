CREATE TABLE public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules"
  ON public.class_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage schedules"
  ON public.class_schedules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can view schedules"
  ON public.class_schedules FOR SELECT
  TO anon USING (true);