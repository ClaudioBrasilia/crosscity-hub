-- Allow authenticated users to create daily battle records
CREATE POLICY "Authenticated users can insert battles"
  ON public.territory_battles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update energy_by_clan
CREATE POLICY "Authenticated users can update battles"
  ON public.territory_battles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);