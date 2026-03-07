-- =============================================
-- BRUTIFY — Table creator_analyses
-- Stocke les analyses concurrentielles complètes
-- =============================================

-- Table principale
CREATE TABLE IF NOT EXISTS public.creator_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  videos_analyzed INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  cost_bp INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_analyses_user ON public.creator_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_analyses_creator ON public.creator_analyses(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_analyses_status ON public.creator_analyses(status);

-- RLS
ALTER TABLE public.creator_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_analyses_select_own"
  ON public.creator_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "creator_analyses_insert_own"
  ON public.creator_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creator_analyses_update_own"
  ON public.creator_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Ajouter 'creator_analysis' aux actions autorisées des credit_transactions
-- (DROP + re-CREATE du constraint car ALTER CHECK n'existe pas en PG)
ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_action_check;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_action_check
  CHECK (action IN (
    'script_generation', 'transcription', 'video_analysis',
    'credit_purchase', 'monthly_reset', 'plan_upgrade',
    'inspire_vault', 'scraping', 'creator_analysis',
    'bp_borrow', 'rollover', 'activation_bonus', 'early_upgrade_bonus'
  ));

-- Ajouter le compteur d'analyses gratuites au profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_analyses_used INTEGER DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_analyses_reset_at TIMESTAMPTZ DEFAULT now();

COMMENT ON TABLE public.creator_analyses IS 'Analyses concurrentielles complètes des créateurs';
COMMENT ON COLUMN public.creator_analyses.analysis IS 'Résultat JSON complet de l analyse IA';
COMMENT ON COLUMN public.creator_analyses.videos_analyzed IS 'Nombre de vidéos analysées';
COMMENT ON COLUMN public.creator_analyses.cost_bp IS 'Coût total en BP de cette analyse';
