CREATE TABLE IF NOT EXISTS public.timewall_postbacks (
  transaction_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_coins bigint NOT NULL DEFAULT 0,
  credited_coins bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.timewall_postbacks TO service_role;
GRANT SELECT ON public.timewall_postbacks TO authenticated;
ALTER TABLE public.timewall_postbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "postbacks admin read" ON public.timewall_postbacks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));