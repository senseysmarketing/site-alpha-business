CREATE POLICY "Anyone can create leads from public forms"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);