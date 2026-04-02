-- Create class_schedules table
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label VARCHAR(255),
    day_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc. Empty means all days or handled by logic
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Class schedules are readable by all" ON public.class_schedules
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage class schedules" ON public.class_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default schedules if empty
INSERT INTO public.class_schedules (start_time, end_time, label)
SELECT '06:00:00', '07:00:00', 'Aula Manhã 1'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules);

INSERT INTO public.class_schedules (start_time, end_time, label)
SELECT '07:00:00', '08:00:00', 'Aula Manhã 2'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE start_time = '07:00:00');

INSERT INTO public.class_schedules (start_time, end_time, label)
SELECT '12:00:00', '13:00:00', 'Aula Almoço'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE start_time = '12:00:00');

INSERT INTO public.class_schedules (start_time, end_time, label)
SELECT '18:00:00', '19:00:00', 'Aula Noite 1'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE start_time = '18:00:00');

INSERT INTO public.class_schedules (start_time, end_time, label)
SELECT '19:00:00', '20:00:00', 'Aula Noite 2'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE start_time = '19:00:00');
