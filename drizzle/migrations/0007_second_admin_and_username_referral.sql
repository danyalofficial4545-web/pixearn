CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uname text; ref_code text; ref_id uuid;
BEGIN
  uname := lower(coalesce(nullif(NEW.raw_user_meta_data->>'username',''), split_part(NEW.email,'@',1)));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = uname) THEN
    uname := uname || '_' || floor(1000 + random()*9000)::text;
  END IF;
  ref_code := NEW.raw_user_meta_data->>'ref';
  IF ref_code IS NOT NULL THEN
    SELECT id INTO ref_id FROM public.profiles
      WHERE lower(username) = lower(ref_code) OR lower(referral_code) = lower(ref_code) LIMIT 1;
  END IF;
  INSERT INTO public.profiles (id, username, email, referral_code, referred_by)
  VALUES (NEW.id, uname, NEW.email, uname, ref_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(coalesce(NEW.email,'')) IN ('muhammaddanyal4545@gmail.com','muhammaddanyal4949@gmail.com')
     OR uname IN ('danyal955163','danyal955') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;