-- Ajoute le type 'ai' aux idées du Vault (Inspiration IA)
-- À exécuter dans le SQL Editor de ton projet Supabase

ALTER TABLE public.vault_items
  DROP CONSTRAINT IF EXISTS vault_items_type_check;

ALTER TABLE public.vault_items
  ADD CONSTRAINT vault_items_type_check
    CHECK (type IN ('video', 'script', 'manual', 'ai'));
