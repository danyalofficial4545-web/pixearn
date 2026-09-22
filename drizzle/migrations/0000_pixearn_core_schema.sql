-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- PACKAGES
CREATE TABLE public.packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_coins bigint NOT NULL DEFAULT 0,
  daily_tasks int NOT NULL DEFAULT 1,
  daily_earning_coins bigint NOT NULL DEFAULT 0,
  validity_days int,
  min_withdraw_coins bigint NOT NULL,
  withdraw_options int[] NOT NULL DEFAULT '{}',
  sort int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages public read" ON public.packages FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.packages (id,name,price_coins,daily_tasks,daily_earning_coins,validity_days,min_withdraw_coins,withdraw_options,sort) VALUES
 ('free','FREE Package',0,1,300,NULL,50000,'{500,1000}',1),
 ('p200','Package 200',20000,2,2500,30,30000,'{300,500,1000}',2),
 ('p500','Package 500',50000,5,7000,30,60000,'{600,1000,3000,10000}',3);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  avatar_url text,
  deposit_balance bigint NOT NULL DEFAULT 0,
  earning_balance bigint NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid,
  banned boolean NOT NULL DEFAULT false,
  package_id text NOT NULL DEFAULT 'free' REFERENCES public.packages(id),
  package_expires_at timestamptz,
  total_earned bigint NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- protect sensitive columns from client updates
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('role', true) <> 'service_role' AND auth.uid() IS NOT NULL THEN
    NEW.deposit_balance := OLD.deposit_balance;
    NEW.earning_balance := OLD.earning_balance;
    NEW.package_id := OLD.package_id;
    NEW.package_expires_at := OLD.package_expires_at;
    NEW.banned := OLD.banned;
    NEW.referral_code := OLD.referral_code;
    NEW.referred_by := OLD.referred_by;
    NEW.total_earned := OLD.total_earned;
    NEW.tasks_completed := OLD.tasks_completed;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_profile_columns BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname text;
  rcode text;
  ref_code text;
  ref_id uuid;
BEGIN
  uname := coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) THEN
    uname := uname || floor(random()*10000)::text;
  END IF;
  rcode := upper(substr(replace(NEW.id::text,'-',''),1,8));
  ref_code := NEW.raw_user_meta_data->>'ref';
  IF ref_code IS NOT NULL THEN
    SELECT id INTO ref_id FROM public.profiles WHERE referral_code = upper(ref_code);
  END IF;
  INSERT INTO public.profiles (id, username, email, referral_code, referred_by)
  VALUES (NEW.id, uname, NEW.email, rcode, ref_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.settings (key,value) VALUES
 ('jazzcash_number','03001234567'),
 ('jazzcash_title','PixEarn Official'),
 ('easypaisa_number','03007654321'),
 ('easypaisa_title','PixEarn Official'),
 ('usdt_address','0x0000000000000000000000000000000000000000'),
 ('usdt_network','BEP20'),
 ('deposit_instructions','Please send money to the correct number and upload proof. Wrong number payment will not be accepted.'),
 ('coins_per_pkr','100'),
 ('usd_pkr','280'),
 ('timewall_wall_id','YOUR_WALL_ID'),
 ('timewall_user_percent','10'),
 ('referral_level1_percent','20'),
 ('referral_level2_percent','5');

-- TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text,
  description text NOT NULL DEFAULT '',
  reward_coins bigint NOT NULL DEFAULT 0,
  profit_coins bigint NOT NULL DEFAULT 0,
  play_store_link text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.tasks FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.tasks (title, description, reward_coins, profit_coins, play_store_link, image_url) VALUES
 ('Install & Play Ludo Star','1. Install the app from Play Store.\n2. Open and register a new account.\n3. Play one full match.\n4. Submit your in-game User ID with a screenshot.',1200,400,'https://play.google.com/store','https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=600'),
 ('Sign Up on Shopping App','1. Install the app.\n2. Create an account using your own number.\n3. Screenshot the home screen after login.',900,300,'https://play.google.com/store','https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600'),
 ('Play Car Racing 3D for 10 Minutes','1. Install the game.\n2. Reach level 3.\n3. Submit your User ID and a screenshot of level 3.',1500,500,'https://play.google.com/store','https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600');

-- TASK SUBMISSIONS
CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  game_user_id text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.task_submissions TO authenticated;
GRANT ALL ON public.task_submissions TO service_role;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.task_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs insert own" ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- DEPOSITS
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_pkr integer NOT NULL,
  coins bigint NOT NULL,
  method text NOT NULL,
  tid text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits read own" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "deposits insert own" ON public.deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- WITHDRAWALS
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_pkr integer NOT NULL,
  coins bigint NOT NULL,
  method text NOT NULL,
  account_title text NOT NULL,
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals read own" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet text NOT NULL,
  type text NOT NULL,
  coins bigint NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_idx ON public.transactions(user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx read own" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- REFERRAL EARNINGS
CREATE TABLE public.referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  kind text NOT NULL,
  coins bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref read own" ON public.referral_earnings FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR public.has_role(auth.uid(),'admin'));

-- DAILY EARNINGS TRACKER (for daily caps)
CREATE TABLE public.daily_earnings (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT current_date,
  coins bigint NOT NULL DEFAULT 0,
  tasks int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.daily_earnings TO authenticated;
GRANT ALL ON public.daily_earnings TO service_role;
ALTER TABLE public.daily_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily read own" ON public.daily_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));