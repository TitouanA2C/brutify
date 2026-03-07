# 🚀 Checklist de déploiement Brutify

## ⚠️ CRITIQUE : Migrations DB à exécuter

Avant de déployer, tu DOIS exécuter ces migrations SQL dans l'ordre :

### 1. Suppression du plan "free"
```bash
psql $DATABASE_URL < supabase/remove_free_plan.sql
```

**Ou via Supabase Dashboard** :
1. Va dans SQL Editor
2. Copie-colle `supabase/remove_free_plan.sql`
3. Exécute

### 2. Système de fidélisation (emprunt, rollover, bonus)
```bash
psql $DATABASE_URL < supabase/add_borrowed_credits.sql
```

**Ou via Supabase Dashboard** :
1. Va dans SQL Editor
2. Copie-colle `supabase/add_borrowed_credits.sql`
3. Exécute

## ✅ Vérifications post-migration

### 1. Vérifier les colonnes
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'plan', 
  'borrowed_credits', 
  'rollover_credits', 
  'free_transcripts_used',
  'free_transcripts_reset_at',
  'activation_bonuses'
)
ORDER BY column_name;
```

**Résultat attendu** :
```
activation_bonuses         | jsonb     | {...}          | YES
borrowed_credits           | integer   | 0              | YES
free_transcripts_reset_at  | timestamp | now()          | YES
free_transcripts_used      | integer   | 0              | YES
plan                       | text      | 'creator'      | YES
rollover_credits           | integer   | 0              | YES
```

### 2. Vérifier les contraintes
```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%credits%';
```

**Résultat attendu** :
```
check_borrowed_credits_positive  | borrowed_credits >= 0
check_rollover_credits_positive  | rollover_credits >= 0
...
```

### 3. Vérifier les utilisateurs existants
```sql
SELECT id, plan, credits, borrowed_credits, rollover_credits
FROM profiles
LIMIT 5;
```

**Tous les plans doivent être** : `creator`, `growth`, ou `scale` (pas de `free`).

## 🧪 Tests locaux AVANT déploiement

### Test 1 : Emprunt BP
```
1. npm run dev
2. Mettre BP à 0 (via dev-credit API ou Supabase)
3. Vérifier alerte "Plus de BP"
4. Cliquer "Emprunter 50 BP"
5. ✓ Credits = 50, borrowed_credits = 50
6. ✓ Sidebar affiche "(50 empruntés)"
```

### Test 2 : Transcriptions gratuites
```
1. Aller sur /videos
2. Cliquer "Transcrire" sur une vidéo
3. ✓ Button affiche "Transcrire (gratuit)"
4. ✓ Transcription réussie sans consommer BP
5. ✓ Compteur "2/3 transcriptions gratuites"
```

### Test 3 : Bonus d'activation
```
1. Dashboard affiche tracker "Bonus d'activation"
2. Suivre 3 créateurs
3. ✓ Modal "Bonus débloqué ! +50 BP"
4. ✓ Tracker affiche "Premier radar" ✓
```

### Test 4 : Bonus early upgrade
```
1. Créer un nouveau compte
2. Upgrade vers Growth dans les 7 premiers jours
3. ✓ Banner "Bonus d'upgrade anticipé" visible
4. ✓ Credits = 2000 + 300 = 2300 BP
```

### Test 5 : Rollover (simulation)
```
1. Via Supabase, set credits = 1500 (Growth avec reste)
2. Simuler renouvellement (webhook test)
3. ✓ rollover_credits = 1000 (cap 50%)
4. ✓ credits = 2000 + 1000 = 3000 BP
```

## 📦 Build et vérification

### 1. Build local
```bash
npm run build
```

**Erreurs à surveiller** :
- Types TypeScript manquants
- Imports incorrects
- Useeffect dependencies

### 2. Vérifier les routes API
```bash
# Tester les nouvelles routes
curl http://localhost:3000/api/credits/borrow
curl http://localhost:3000/api/activation/bonus
```

## 🌐 Déploiement production

### 1. Variables d'environnement (Vercel)

Vérifier que ces variables sont configurées :
```
DATABASE_URL=***
SUPABASE_URL=***
SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_ROLE_KEY=***
STRIPE_SECRET_KEY=***
STRIPE_WEBHOOK_SECRET=***
OPENAI_API_KEY=***
OPENROUTER_API_KEY=***
APIFY_TOKEN=***
CRON_SECRET=***
```

### 2. Push to production
```bash
git add .
git commit -m "feat: complete fidelization system (borrow, rollover, free transcripts, activation bonuses)"
git push
```

### 3. Webhooks Stripe

**IMPORTANT** : Vérifier que le webhook Stripe en production reçoit les events :
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Dashboard Stripe → Webhooks → Vérifier endpoint Vercel

### 4. Supabase RLS (Row Level Security)

Vérifier les policies pour les nouvelles colonnes :

```sql
-- Les users peuvent lire leur propre profil
SELECT * FROM profiles WHERE auth.uid() = id;

-- Pas besoin de policy spéciale pour borrowed_credits, rollover_credits, etc.
-- Elles sont incluses dans la policy existante
```

## 🎯 Monitoring post-déploiement

### Métriques à surveiller (premières 48h)

1. **Emprunt BP**
   ```sql
   -- Combien d'utilisateurs ont emprunté ?
   SELECT COUNT(*), AVG(borrowed_credits), MAX(borrowed_credits)
   FROM profiles
   WHERE borrowed_credits > 0;
   ```

2. **Transcriptions gratuites**
   ```sql
   -- Combien de transcriptions gratuites utilisées ?
   SELECT plan, AVG(free_transcripts_used), COUNT(*)
   FROM profiles
   GROUP BY plan;
   ```

3. **Bonus d'activation**
   ```sql
   -- Quels bonus sont les plus débloqués ?
   SELECT 
     (activation_bonuses->>'follow_creators')::boolean as follow,
     (activation_bonuses->>'generate_script')::boolean as script,
     COUNT(*)
   FROM profiles
   WHERE activation_bonuses IS NOT NULL
   GROUP BY follow, script;
   ```

4. **Early upgrade bonus**
   ```sql
   -- Combien ont upgradé dans les 7 premiers jours ?
   SELECT COUNT(*)
   FROM credit_transactions
   WHERE action = 'activation_bonus_early_upgrade'
   AND created_at >= NOW() - INTERVAL '7 days';
   ```

### Logs à surveiller

```bash
# Vercel logs
vercel logs --follow

# Chercher ces patterns :
[Borrow] User xxx borrowed 50 BP
[Activation] User xxx unlocked "Premier radar" (+50 BP)
[Stripe Webhook] Monthly reset for xxx: 2000 credits + 800 rollover - 150 borrowed = 2650 final
```

## 🐛 Rollback plan

Si problème critique :

### 1. Rollback code
```bash
git revert HEAD
git push
```

### 2. Rollback DB (DERNIER RECOURS)
```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE profiles DROP COLUMN IF EXISTS borrowed_credits;
ALTER TABLE profiles DROP COLUMN IF EXISTS rollover_credits;
ALTER TABLE profiles DROP COLUMN IF EXISTS free_transcripts_used;
ALTER TABLE profiles DROP COLUMN IF EXISTS free_transcripts_reset_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS activation_bonuses;
```

## 📊 KPIs attendus (7 premiers jours)

| Métrique | Avant | Cible | Comment mesurer |
|----------|-------|-------|-----------------|
| Churn mensuel | 8% | 4% | Users actifs / Users total |
| Conversion essai | 25% | 35%+ | Souscriptions / Trials |
| LTV | 180€ | 270€+ | Revenue total / Users |
| Engagement | 60% | 80%+ | Users actifs 7j / Total |
| BP empruntés | 0 | 30% users | borrowed_credits > 0 |
| Bonus débloqués | 0 | 50% users | activation_bonuses not null |

## 🎯 Communication utilisateurs

### Email à envoyer (optionnel mais recommandé)

**Sujet** : "🎁 Nouveautés Brutify : plus de BP, moins de friction"

**Body** :
```
Salut [NAME] !

On a ajouté des features pour que tu ne sois plus jamais bloqué :

✅ Rollover BP : Les BP non utilisés se reportent (jusqu'à 50%)
✅ Emprunt BP : Emprunte sur le mois prochain si besoin
✅ Transcriptions gratuites : 3/5/10 par mois selon ton plan
✅ Bonus d'activation : Jusqu'à 550 BP de bonus à débloquer

Plus de détails sur brutify.com/changelog

À bientôt,
L'équipe Brutify
```

## 🔧 Support technique

Si un user signale un problème :

1. **Check son profil DB**
   ```sql
   SELECT id, plan, credits, borrowed_credits, rollover_credits, 
          free_transcripts_used, activation_bonuses
   FROM profiles 
   WHERE email = 'user@example.com';
   ```

2. **Check ses transactions**
   ```sql
   SELECT action, amount, created_at
   FROM credit_transactions
   WHERE user_id = 'xxx'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Reset manuel si nécessaire**
   ```sql
   -- Reset emprunt
   UPDATE profiles 
   SET borrowed_credits = 0 
   WHERE id = 'xxx';

   -- Reset transcriptions gratuites
   UPDATE profiles 
   SET free_transcripts_used = 0,
       free_transcripts_reset_at = NOW()
   WHERE id = 'xxx';
   ```

---

**Date de préparation** : 2026-03-06  
**Version** : 2.0.0  
**Breaking changes** : Migration DB requise ⚠️
