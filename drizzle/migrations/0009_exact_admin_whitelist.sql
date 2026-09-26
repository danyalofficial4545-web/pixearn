-- Keep database role data aligned with the application admin whitelist.
-- The application and server guards also enforce this whitelist at runtime.

DELETE FROM public.user_roles ur
USING public.profiles p
WHERE ur.user_id = p.id
  AND ur.role = 'admin'
  AND lower(coalesce(p.email, '')) NOT IN (
    'muhammaddanyal4949@gmail.com',
    'muhammaddanyal4545@gmail.com'
  )
  AND lower(coalesce(p.username, '')) NOT IN (
    'danyal955',
    'danyal955163',
    'danyal1953'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'
FROM public.profiles p
WHERE lower(coalesce(p.email, '')) IN (
  'muhammaddanyal4949@gmail.com',
  'muhammaddanyal4545@gmail.com'
)
OR lower(coalesce(p.username, '')) IN (
  'danyal955',
  'danyal955163',
  'danyal1953'
)
ON CONFLICT DO NOTHING;

UPDATE public.profiles
SET referral_code = username
WHERE referral_code IS NULL OR referral_code <> username;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uname text;
  ref_code text;
  ref_id uuid;
BEGIN
  uname := lower(coalesce(nullif(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1)));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = uname) THEN
    uname := uname || '_' || floor(1000 + random() * 9000)::text;
  END IF;

  ref_code := lower(trim(NEW.raw_user_meta_data->>'ref'));
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO ref_id
    FROM public.profiles
    WHERE lower(username) = ref_code OR lower(referral_code) = ref_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, email, referral_code, referred_by)
  VALUES (NEW.id, uname, lower(NEW.email), uname, ref_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  IF lower(coalesce(NEW.email, '')) IN (
       'muhammaddanyal4949@gmail.com',
       'muhammaddanyal4545@gmail.com'
     )
     OR uname IN ('danyal955', 'danyal955163', 'danyal1953') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
