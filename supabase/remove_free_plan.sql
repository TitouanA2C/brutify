-- =============================================
-- MIGRATION: SUPPRESSION DU PLAN FREE
-- Date: 2026-03-06
-- =============================================

-- 1. Mettre à jour tous les utilisateurs "free" vers "creator" avec 0 crédits
UPDATE public.profiles
SET 
  plan = 'creator',
  credits = 0,
  updated_at = now()
WHERE plan = 'free';

-- 2. Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 3. Ajouter la nouvelle contrainte CHECK (sans 'free')
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('creator', 'growth', 'scale'));

-- 4. Modifier le DEFAULT pour le plan
ALTER TABLE public.profiles
ALTER COLUMN plan SET DEFAULT 'creator';

-- 5. Modifier le DEFAULT pour les crédits (500 au lieu de 50 pour Creator trial)
ALTER TABLE public.profiles
ALTER COLUMN credits SET DEFAULT 500;

-- Vérification
SELECT 
  plan, 
  COUNT(*) as count,
  AVG(credits) as avg_credits
FROM public.profiles
GROUP BY plan
ORDER BY plan;

-- =============================================
-- NOTES
-- =============================================
-- 
-- Après cette migration :
-- - Tous les anciens utilisateurs "free" sont sur "creator" avec 0 BP
-- - Nouveaux utilisateurs commencent avec "creator" + 500 BP (trial)
-- - Le plan "free" n'existe plus dans la base de données
-- - Les 3 plans disponibles : creator, growth, scale
-- 
-- =============================================
