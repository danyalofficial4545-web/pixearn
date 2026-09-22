CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin settings admin read" ON public.admin_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
INSERT INTO public.admin_settings (key,value) VALUES ('timewall_secret', encode(gen_random_bytes(16),'hex'));