-- ============================================================
-- Boucle de rétroaction : vidéos publiées liées aux scripts
-- À exécuter dans le SQL Editor de ton projet Supabase
-- ============================================================

-- Requête 01 — Colonne owner_user_id sur la table videos
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Requête 02 — Index sur owner_user_id
CREATE INDEX IF NOT EXISTS idx_videos_owner_user_id
  ON public.videos(owner_user_id);

-- Requête 03 — Colonne published_video_id sur la table scripts
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS published_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL;

-- Requête 04 — Colonne published_at sur la table scripts
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Requête 05 — Supprimer l'ancienne contrainte de statut
ALTER TABLE public.scripts
  DROP CONSTRAINT IF EXISTS scripts_status_check;

-- Requête 06 — Recréer la contrainte avec le statut 'published'
ALTER TABLE public.scripts
  ADD CONSTRAINT scripts_status_check
    CHECK (status IN ('draft', 'saved', 'archived', 'published'));

-- Requête 07 — Index sur published_video_id
CREATE INDEX IF NOT EXISTS idx_scripts_published_video_id
  ON public.scripts(published_video_id);
