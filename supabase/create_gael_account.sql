-- ============================================================
-- Création du compte Gaël — Plan Growth
-- À exécuter APRÈS avoir créé l'utilisateur dans
-- Supabase Dashboard → Authentication → Users → Add user
-- ============================================================

-- Remplace 'gael@example.com' par le vrai email de Gaël

-- Requête 01 — Configurer le profil avec le plan Growth
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  plan,
  credits,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  'Gaël',
  'growth',
  800,               -- crédits du plan Growth
  true,              -- passe l'onboarding (déjà dev)
  now(),
  now()
FROM auth.users
WHERE email = 'gael@example.com'  -- <-- remplace par le vrai email
ON CONFLICT (id) DO UPDATE SET
  full_name          = 'Gaël',
  plan               = 'growth',
  credits            = 800,
  onboarding_completed = true,
  updated_at         = now();

-- Requête 02 — Vérification : affiche le profil créé
SELECT
  p.id,
  p.email,
  p.full_name,
  p.plan,
  p.credits,
  p.onboarding_completed,
  u.created_at AS auth_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'gael@example.com';  -- <-- remplace par le vrai email
