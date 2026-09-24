CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uname text; rcode text; ref_code text; ref_id uuid;
BEGIN
  uname := lower(coalesce(nullif(NEW.raw_user_meta_data->>'username',''), split_part(NEW.email,'@',1)));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = uname) THEN
    uname := uname || '_' || floor(1000 + random()*9000)::text;
  END IF;
  rcode := upper(substr(replace(NEW.id::text,'-',''),1,8));
  ref_code := NEW.raw_user_meta_data->>'ref';
  IF ref_code IS NOT NULL THEN
    SELECT id INTO ref_id FROM public.profiles
      WHERE lower(username) = lower(ref_code) OR referral_code = upper(ref_code) LIMIT 1;
  END IF;
  INSERT INTO public.profiles (id, username, email, referral_code, referred_by)
  VALUES (NEW.id, uname, NEW.email, rcode, ref_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(coalesce(NEW.email,'')) = 'muhammaddanyal4545@gmail.com' OR uname = 'danyal955163' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;