-- =============================================
-- BRUTIFY — SCHEMA COMPLET
-- À exécuter dans Supabase SQL Editor
-- =============================================


-- =============================================
-- USERS & AUTH
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'growth', 'scale')),
  credits INTEGER NOT NULL DEFAULT 50,
  monthly_credits_reset_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  niche TEXT,
  tone_of_voice TEXT,
  writing_style TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('script_generation', 'transcription', 'video_analysis', 'credit_purchase', 'monthly_reset', 'plan_upgrade')),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =============================================
-- CRÉATEURS
-- =============================================

CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  platform_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  growth_rate NUMERIC(5,2) DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  niche TEXT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, platform_id)
);

CREATE INDEX idx_creators_platform_handle ON public.creators(platform, handle);
CREATE INDEX idx_creators_niche ON public.creators(niche);

CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, creator_id)
);

CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);


-- =============================================
-- VIDÉOS
-- =============================================

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  platform_video_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  outlier_score NUMERIC(6,2),
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, platform_video_id)
);

CREATE INDEX idx_videos_creator ON public.videos(creator_id);
CREATE INDEX idx_videos_outlier ON public.videos(outlier_score DESC);
CREATE INDEX idx_videos_posted ON public.videos(posted_at DESC);

CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id)
);

CREATE TABLE public.video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hook_type TEXT,
  hook_analysis TEXT,
  structure_type TEXT,
  structure_analysis TEXT,
  style_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id)
);


-- =============================================
-- SCRIPTS
-- =============================================

CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT,
  initial_draft TEXT,
  hook_type TEXT,
  hook_text TEXT,
  structure_type TEXT,
  body TEXT,
  cta TEXT,
  ai_notes TEXT,
  tone TEXT,
  niche TEXT,
  source_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scripts_user ON public.scripts(user_id);


-- =============================================
-- BRUTBOARD (Calendrier éditorial)
-- =============================================

CREATE TABLE public.board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'in_progress', 'scheduled', 'published')),
  scheduled_date DATE,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'multi')),
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  source_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_board_user ON public.board_items(user_id);
CREATE INDEX idx_board_status ON public.board_items(user_id, status);
CREATE INDEX idx_board_date ON public.board_items(user_id, scheduled_date);


-- =============================================
-- BANQUE D'IDÉES (Vault)
-- =============================================

CREATE TABLE public.vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'script', 'manual')),
  content TEXT NOT NULL,
  source_handle TEXT,
  source_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  source_script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vault_user ON public.vault_items(user_id);


-- =============================================
-- HOOK & STRUCTURE TEMPLATES (référentiel)
-- =============================================

CREATE TABLE public.hook_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template TEXT NOT NULL,
  description TEXT,
  performance_score INTEGER DEFAULT 50,
  position INTEGER DEFAULT 0
);

CREATE TABLE public.script_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skeleton TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0
);


-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_structures ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Credit transactions
CREATE POLICY "credits_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credits_insert_own" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Creators (lecture pour tous les users authentifiés, écriture via service_role)
CREATE POLICY "creators_select_auth" ON public.creators FOR SELECT USING (auth.role() = 'authenticated');

-- Watchlists
CREATE POLICY "watchlists_select_own" ON public.watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watchlists_insert_own" ON public.watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watchlists_delete_own" ON public.watchlists FOR DELETE USING (auth.uid() = user_id);

-- Videos
CREATE POLICY "videos_select_auth" ON public.videos FOR SELECT USING (auth.role() = 'authenticated');

-- Transcriptions
CREATE POLICY "transcriptions_select_auth" ON public.transcriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transcriptions_insert_own" ON public.transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video analyses
CREATE POLICY "analyses_select_auth" ON public.video_analyses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "analyses_insert_own" ON public.video_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scripts
CREATE POLICY "scripts_all_own" ON public.scripts FOR ALL USING (auth.uid() = user_id);

-- Board items
CREATE POLICY "board_all_own" ON public.board_items FOR ALL USING (auth.uid() = user_id);

-- Vault items
CREATE POLICY "vault_all_own" ON public.vault_items FOR ALL USING (auth.uid() = user_id);

-- Templates (lecture publique pour auth)
CREATE POLICY "hooks_select_auth" ON public.hook_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "structures_select_auth" ON public.script_structures FOR SELECT USING (auth.role() = 'authenticated');


-- =============================================
-- FUNCTIONS
-- =============================================

-- Créer le profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Consommer des crédits
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles SET credits = credits - p_amount, updated_at = now() WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, action, reference_id)
  VALUES (p_user_id, -p_amount, p_action, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculer l'outlier score d'une vidéo
CREATE OR REPLACE FUNCTION public.calculate_outlier_score(p_video_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_views INTEGER;
  v_creator_id UUID;
  v_avg_views INTEGER;
BEGIN
  SELECT views, creator_id INTO v_views, v_creator_id FROM public.videos WHERE id = p_video_id;
  SELECT avg_views INTO v_avg_views FROM public.creators WHERE id = v_creator_id;

  IF v_avg_views IS NULL OR v_avg_views = 0 THEN
    RETURN 1.0;
  END IF;

  RETURN ROUND((v_views::NUMERIC / v_avg_views::NUMERIC), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
