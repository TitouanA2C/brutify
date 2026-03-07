-- Migration: Système complet de fidélisation BP
-- Date: 2026-03-06

-- 1. Ajouter la colonne borrowed_credits (emprunt)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS borrowed_credits INTEGER DEFAULT 0;

-- 2. Ajouter la colonne rollover_credits (report des BP non utilisés)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rollover_credits INTEGER DEFAULT 0;

-- 3. Ajouter une colonne pour tracker les transcriptions gratuites
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_transcripts_used INTEGER DEFAULT 0;

-- 4. Ajouter une colonne pour le dernier reset (pour le compteur mensuel)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_transcripts_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Ajouter une colonne pour tracker les bonus d'activation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS activation_bonuses JSONB DEFAULT '{
  "follow_creators": false,
  "scrape_videos": false,
  "generate_script": false,
  "add_to_board": false,
  "early_upgrade": false
}'::jsonb;

-- 6. Ajouter des contraintes de sécurité
ALTER TABLE public.profiles
ADD CONSTRAINT check_borrowed_credits_positive 
CHECK (borrowed_credits >= 0);

ALTER TABLE public.profiles
ADD CONSTRAINT check_rollover_credits_positive 
CHECK (rollover_credits >= 0);

ALTER TABLE public.profiles
ADD CONSTRAINT check_free_transcripts_positive 
CHECK (free_transcripts_used >= 0);

-- 7. Commentaires
COMMENT ON COLUMN public.profiles.borrowed_credits IS 
'BP empruntés sur le mois prochain. Déduits lors du renouvellement.';

COMMENT ON COLUMN public.profiles.rollover_credits IS 
'BP reportés du mois précédent. Max 50% du quota mensuel.';

COMMENT ON COLUMN public.profiles.free_transcripts_used IS 
'Nombre de transcriptions gratuites utilisées ce mois-ci.';

COMMENT ON COLUMN public.profiles.free_transcripts_reset_at IS 
'Date du dernier reset du compteur de transcriptions gratuites.';

COMMENT ON COLUMN public.profiles.activation_bonuses IS 
'Bonus d''activation débloqués (follow_creators, scrape_videos, generate_script, add_to_board, early_upgrade).';
