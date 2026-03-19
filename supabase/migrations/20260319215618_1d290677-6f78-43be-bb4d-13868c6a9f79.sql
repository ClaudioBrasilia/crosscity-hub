
-- Tabela de locais de treino para check-in com geolocalização
CREATE TABLE public.training_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  box_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.training_locations ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver locais ativos
CREATE POLICY "Authenticated users can view active locations"
  ON public.training_locations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Apenas admins podem gerenciar locais
CREATE POLICY "Admins can manage training locations"
  ON public.training_locations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
