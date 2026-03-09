-- Migration: colonnes pour tracker l'origine et le contexte des leads (onboarding)
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS creation_context TEXT,
  ADD COLUMN IF NOT EXISTS signup_urgency TEXT;

COMMENT ON COLUMN public.profiles.lead_source IS 'Comment le user a connu Brutify (réseaux, recherche, proche, pub, influenceur, autre)';
COMMENT ON COLUMN public.profiles.creation_context IS 'Contexte de création: solo, assistant, equipe';
COMMENT ON COLUMN public.profiles.signup_urgency IS 'Urgence: asap, cette_semaine, je_compare';
