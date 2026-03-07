-- =============================================
-- CRÉER UN FAUX ABONNEMENT POUR LES TESTS (VERSION SIMPLE)
-- =============================================
-- Utilise directement l'UUID de l'utilisateur

-- ⚠️ REMPLACE CET UUID PAR TON UUID RÉEL
-- Tu peux le trouver en exécutant: SELECT id, email FROM public.profiles LIMIT 10;

DO $$
DECLARE
  v_user_id UUID := '63e1f10c-fd77-4722-8595-4e5f9b';  -- ⚠️ REMPLACE PAR TON UUID COMPLET
  v_fake_customer_id TEXT;
  v_fake_subscription_id TEXT;
  v_current_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe et récupérer son email
  SELECT email INTO v_current_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_current_email IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec UUID % non trouvé.', v_user_id;
  END IF;

  RAISE NOTICE 'Utilisateur trouvé: %', v_current_email;

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
  RAISE NOTICE '   Email: %', v_current_email;
  RAISE NOTICE '   Customer ID: %', v_fake_customer_id;
  RAISE NOTICE '   Subscription ID: %', v_fake_subscription_id;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATTENTION : Ces IDs sont fictifs!';
  RAISE NOTICE '   Tu peux maintenant tester les changements de plan dans l''UI.';
  RAISE NOTICE '   Mais aucune vraie facturation Stripe ne sera effectuée.';
END $$;
