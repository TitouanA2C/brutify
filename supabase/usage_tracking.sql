-- ============================================================
-- Tracking complet des usages API et BrutPoints
-- À exécuter dans le SQL Editor de ton projet Supabase
-- ============================================================

-- Requête 01 — Supprimer la contrainte d'action sur credit_transactions
--             (pour permettre tous les types d'actions présentes et futures)
ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_action_check;

-- Requête 02 — Table api_usage_logs : historique de TOUS les appels API
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service             TEXT NOT NULL,         -- 'openrouter' | 'openai_whisper' | 'apify'
  action              TEXT NOT NULL,         -- 'script_generation' | 'video_analysis' | 'idea_generation' | 'transcription' | 'instagram_profile' | 'instagram_posts'
  model               TEXT,                  -- 'claude-sonnet-4-...' | 'whisper-1' | null
  tokens_in           INTEGER,               -- tokens d'entrée (prompt)
  tokens_out          INTEGER,               -- tokens de sortie (completion)
  units               INTEGER,               -- Apify: nb de résultats ; Whisper: taille en Ko
  estimated_cost_usd  DECIMAL(12, 8),        -- coût estimé en USD
  reference_id        UUID,                  -- video_id / script_id / creator_id associé
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Requête 03 — Index pour les requêtes analytiques
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id
  ON public.api_usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_service_action
  ON public.api_usage_logs(service, action);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at
  ON public.api_usage_logs(created_at DESC);

-- Requête 04 — RLS sur api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_logs_select_own"
  ON public.api_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les insertions se font uniquement via le service role (routes API)
-- Pas de politique INSERT pour les utilisateurs normaux

-- Requête 05 — Vue analytique coûts par utilisateur (pour dashboards internes)
CREATE OR REPLACE VIEW public.usage_summary AS
SELECT
  u.user_id,
  p.email,
  p.plan,
  DATE_TRUNC('month', u.created_at) AS month,
  u.service,
  u.action,
  COUNT(*)                            AS call_count,
  SUM(u.tokens_in)                   AS total_tokens_in,
  SUM(u.tokens_out)                  AS total_tokens_out,
  SUM(u.units)                       AS total_units,
  SUM(u.estimated_cost_usd)          AS total_cost_usd
FROM public.api_usage_logs u
LEFT JOIN public.profiles p ON p.id = u.user_id
GROUP BY u.user_id, p.email, p.plan, DATE_TRUNC('month', u.created_at), u.service, u.action;

-- Requête 06 — Vue crédit_transactions enrichie avec libellés lisibles
CREATE OR REPLACE VIEW public.credit_history AS
SELECT
  ct.id,
  ct.user_id,
  ct.amount,
  ct.action,
  CASE ct.action
    WHEN 'script_generation' THEN 'Script forgé'
    WHEN 'transcription'     THEN 'Transcription vidéo'
    WHEN 'video_analysis'    THEN 'Analyse IA'
    WHEN 'inspire_vault'     THEN 'Inspiration IA'
    WHEN 'scraping'          THEN 'Scraping créateur'
    WHEN 'credit_purchase'   THEN 'Achat de crédits'
    WHEN 'monthly_reset'     THEN 'Recharge mensuelle'
    WHEN 'plan_upgrade'      THEN 'Upgrade plan'
    ELSE ct.action
  END AS action_label,
  ct.reference_id,
  ct.created_at
FROM public.credit_transactions ct;
