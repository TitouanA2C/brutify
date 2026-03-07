-- =============================================
-- UPGRADE COMPTE VERS GROWTH (DEV/TEST)
-- =============================================
-- Cette commande upgrade ton compte vers le plan Growth
-- avec tous les crédits et bonus appropriés

-- ÉTAPE 1: Récupérer ton user_id
-- (Remplace TON_EMAIL par ton email réel)
DO $$
DECLARE
  v_user_id UUID;
  v_created_at TIMESTAMPTZ;
  v_account_age_days NUMERIC;
  v_early_upgrade_bonus INTEGER;
  v_total_credits INTEGER;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id, created_at 
  INTO v_user_id, v_created_at
  FROM public.profiles
  WHERE email = 'TON_EMAIL_ICI'  -- ⚠️ REMPLACE PAR TON EMAIL
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé. Vérifie ton email.';
  END IF;

  -- Calculer l'âge du compte
  v_account_age_days := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 86400;

  -- Bonus early upgrade si < 7 jours
  IF v_account_age_days <= 7 THEN
    v_early_upgrade_bonus := 300;
    RAISE NOTICE 'Compte créé il y a % jours → Bonus early upgrade: 300 BP', ROUND(v_account_age_days, 1);
  ELSE
    v_early_upgrade_bonus := 0;
    RAISE NOTICE 'Compte créé il y a % jours → Pas de bonus early upgrade', ROUND(v_account_age_days, 1);
  END IF;

  v_total_credits := 2000 + v_early_upgrade_bonus;

  -- ÉTAPE 2: Upgrade vers Growth
  UPDATE public.profiles
  SET
    plan = 'growth',
    credits = v_total_credits,
    borrowed_credits = 0,
    rollover_credits = 0,
    free_transcripts_used = 0,
    free_transcripts_reset_at = NOW(),
    monthly_credits_reset_at = NOW(),
    activation_bonuses = CASE 
      WHEN v_early_upgrade_bonus > 0 
      THEN jsonb_set(COALESCE(activation_bonuses, '{}'::jsonb), '{early_upgrade}', 'true')
      ELSE COALESCE(activation_bonuses, '{}'::jsonb)
    END,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- ÉTAPE 3: Logger les transactions
  -- Transaction pour le plan upgrade
  INSERT INTO public.credit_transactions (user_id, amount, action, reference_id)
  VALUES (v_user_id, 2000, 'plan_upgrade_dev', 'manual_upgrade_growth');

  -- Transaction pour le bonus early upgrade (si applicable)
  IF v_early_upgrade_bonus > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, action, reference_id)
    VALUES (v_user_id, v_early_upgrade_bonus, 'activation_bonus_early_upgrade', 'manual_upgrade_growth');
  END IF;

  RAISE NOTICE '✅ Upgrade réussi vers Growth!';
  RAISE NOTICE '   Plan: growth';
  RAISE NOTICE '   Crédits: % BP', v_total_credits;
  RAISE NOTICE '   (dont % BP du plan + % BP bonus)', 2000, v_early_upgrade_bonus;
END $$;
