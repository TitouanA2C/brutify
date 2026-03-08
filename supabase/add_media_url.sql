-- =============================================
-- Migration: add media_url to videos table
-- 
-- media_url = URL directe du fichier vidéo (CDN Instagram/TikTok)
-- Utilisée pour la transcription Whisper.
-- Le champ url existant garde l'URL de la page du post (pour liens UI).
--
-- Exécuter dans Supabase SQL Editor
-- =============================================

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS media_url TEXT;

COMMENT ON COLUMN public.videos.media_url IS 'URL directe du fichier vidéo (CDN). Utilisée par Whisper pour la transcription. Peut expirer.';
