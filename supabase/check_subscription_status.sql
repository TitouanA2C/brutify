-- =============================================
-- VÉRIFIER LE STATUT D'ABONNEMENT
-- =============================================
-- Cette commande vérifie ton profil et ton statut d'abonnement

-- Remplace TON_EMAIL par ton email réel
SELECT 
  id,
  email,
  plan,
  credits,
  stripe_customer_id,
  stripe_subscription_id,
  created_at,
  updated_at
FROM public.profiles
WHERE email = 'TON_EMAIL_ICI'  -- ⚠️ REMPLACE PAR TON EMAIL
LIMIT 1;

-- Si stripe_subscription_id est NULL, c'est normal car tu as upgrader via SQL
-- Le système pense que tu n'as pas d'abonnement actif
