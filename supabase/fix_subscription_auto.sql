-- =============================================
-- CRÉER UN FAUX ABONNEMENT (VERSION AUTO)
-- =============================================
-- Cette version trouve automatiquement le premier utilisateur
-- et crée un faux abonnement pour lui

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_fake_customer_id TEXT;
  v_fake_subscription_id TEXT;
BEGIN
  -- Trouver le premier utilisateur (probablement toi)
  SELECT id, email 
  INTO v_user_id, v_email
  FROM public.profiles
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé dans la base.';
  END IF;

  RAISE NOTICE 'Utilisateur trouvé: % (%)', v_email, v_user_id;

  -- Générer des IDs fictifs pour Stripe
  v_fake_customer_id := 'cus_test_' || substring(gen_random_uuid()::text from 1 for 24);
  v_fake_subscription_id := 'sub_test_' || substring(gen_random_uuid()::text from 1 for 24);

  -- Mettre à jour le profil avec les IDs fictifs
  UPDATE public.profiles
  SET
    stripe_customer_id = v_fake_customer_id,
    stripe_subscription_id = v_fake_subscription_id,
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Faux abonnement créé pour les tests!';
  RAISE NOTICE '   Email: %', v_email;
  RAISE NOTICE '   UUID: %', v_user_id;
  RAISE NOTICE '   Customer ID: %', v_fake_customer_id;
  RAISE NOTICE '   Subscription ID: %', v_fake_subscription_id;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATTENTION : Ces IDs sont fictifs (mode DEV)';
  RAISE NOTICE '   Tu peux maintenant tester les changements de plan.';
  RAISE NOTICE '   Aucune vraie facturation Stripe ne sera effectuée.';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Recharge la page /settings pour voir le changement!';
END $$;
