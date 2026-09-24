-- Referral links now use the public username: /register?ref=username.
-- Keep legacy referral_code links working for existing users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uname text;
  rcode text;
  ref_code text;
  ref_id uuid;
BEGIN
  uname := lower(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(uname)) THEN
    uname := uname || floor(random()*10000)::text;
  END IF;
  rcode := upper(substr(replace(NEW.id::text,'-',''),1,8));
  ref_code := lower(trim(NEW.raw_user_meta_data->>'ref'));
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO ref_id
    FROM public.profiles
    WHERE lower(username) = ref_code OR lower(referral_code) = ref_code
    LIMIT 1;
  END IF;
  INSERT INTO public.profiles (id, username, email, referral_code, referred_by)
  VALUES (NEW.id, uname, NEW.email, rcode, ref_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(coalesce(NEW.email,'')) = 'muhammaddanyal4545@gmail.com' OR lower(uname) = 'danyal955163' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
