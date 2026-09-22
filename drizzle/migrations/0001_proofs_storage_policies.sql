CREATE POLICY "proofs upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "proofs read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));