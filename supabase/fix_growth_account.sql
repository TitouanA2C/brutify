-- =============================================
-- CRÉER UN FAUX ABONNEMENT POUR LE COMPTE GROWTH
-- =============================================
-- Cible spécifiquement le compte xheartyyt@gmail.com

DO $$
DECLARE
  v_user_id UUID := '63e1110c-fd77-4722-8595-4e519b9086d6';  -- UUID du compte xheartyyt
  v_fake_customer_id TEXT;
  v_fake_subscription_id TEXT;
  v_current_email TEXT;
  v_current_plan TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT email, plan INTO v_current_email, v_current_plan
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_current_email IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé.';
  END IF;

  RAISE NOTICE 'Utilisateur trouvé: %', v_current_email;
  RAISE NOTICE 'Plan actuel: %', v_current_plan;

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
  RAISE NOTICE '✅ Faux abonnement créé!';
  RAISE NOTICE '   Email: %', v_current_email;
  RAISE NOTICE '   Plan: %', v_current_plan;
  RAISE NOTICE '   Customer ID: %', v_fake_customer_id;
  RAISE NOTICE '   Subscription ID: %', v_fake_subscription_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Recharge /settings maintenant!';
END $$;

-- Vérification : afficher le résultat
SELECT 
  email, 
  plan, 
  substring(stripe_customer_id from 1 for 20) as customer_id,
  substring(stripe_subscription_id from 1 for 20) as subscription_id
FROM public.profiles
WHERE id = '63e1110c-fd77-4722-8595-4e519b9086d6';
