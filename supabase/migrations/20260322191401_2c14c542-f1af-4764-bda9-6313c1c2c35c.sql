
-- Create storage bucket for challenge proof photos
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-proofs', 'challenge-proofs', true);

-- Allow authenticated users to upload their own proofs
CREATE POLICY "Users can upload challenge proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-proofs');

-- Allow anyone to view proofs (public bucket)
CREATE POLICY "Anyone can view challenge proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'challenge-proofs');

-- Allow users to delete their own proofs
CREATE POLICY "Users can delete own challenge proofs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'challenge-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
