CREATE POLICY "Admins can delete clans"
  ON public.app_clans FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));