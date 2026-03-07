-- =============================================
-- CRÉER UN FAUX ABONNEMENT POUR LES TESTS
-- =============================================
-- Cette commande crée un customer_id et subscription_id fictifs
-- pour permettre de tester les changements de plan sans vrai abonnement Stripe

-- ⚠️ À UTILISER UNIQUEMENT EN DEV/TEST
-- Ne pas utiliser en production !

DO $$
DECLARE
  v_user_id UUID;
  v_fake_customer_id TEXT;
  v_fake_subscription_id TEXT;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id 
  INTO v_user_id
  FROM public.profiles
  WHERE email = 'TON_EMAIL_ICI'  -- ⚠️ REMPLACE PAR TON EMAIL
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé. Vérifie ton email.';
  END IF;

  -- Générer des IDs fictifs pour Stripe (format similaire aux vrais IDs Stripe)
  v_fake_customer_id := 'cus_test_' || substring(gen_random_uuid()::text from 1 for 24);
  v_fake_subscription_id := 'sub_test_' || substring(gen_random_uuid()::text from 1 for 24);

  -- Mettre à jour le profil avec les IDs fictifs
  UPDATE public.profiles
  SET
    stripe_customer_id = v_fake_customer_id,
    stripe_subscription_id = v_fake_subscription_id,
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Faux abonnement créé pour les tests!';
  RAISE NOTICE '   Customer ID: %', v_fake_customer_id;
  RAISE NOTICE '   Subscription ID: %', v_fake_subscription_id;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATTENTION : Ces IDs sont fictifs!';
  RAISE NOTICE '   Tu peux maintenant tester les changements de plan dans l''UI.';
  RAISE NOTICE '   Mais aucune vraie facturation Stripe ne sera effectuée.';
END $$;
