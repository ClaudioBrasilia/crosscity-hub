-- Add logo_url column to training_locations
ALTER TABLE public.training_locations ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- Create storage bucket for box logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('box-logos', 'box-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to box-logos bucket
CREATE POLICY "Admins can upload box logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'box-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read access
CREATE POLICY "Anyone can view box logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'box-logos');

-- Allow admins to update/delete
CREATE POLICY "Admins can update box logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'box-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete box logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'box-logos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);