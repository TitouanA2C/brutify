# Suppression du Plan Free ❌

## Vue d'ensemble

Le plan "free" a été complètement retiré du code. Désormais :
- **Plan par défaut** : Creator (avec essai gratuit de 7 jours)
- **3 plans disponibles** : Creator, Growth, Scale
- **Tous les nouveaux utilisateurs** commencent avec 7 jours d'essai gratuit du plan Creator

---

## Changements effectués

### 1. ✅ Configuration des plans

**`src/lib/stripe/config.ts`**
- Type `PlanKey` : déjà sans "free" ✅
- Plans Stripe : Creator, Growth, Scale uniquement

**`src/lib/plans.ts`**
- Supprimé `free` de `PLAN_FEATURES`
- Mis à jour `getMinPlanForFeature()` : ordre = ["creator", "growth", "scale"]
- Mis à jour `getMaxCreditsForPlan()` : fallback = 500 (au lieu de 50)

---

### 2. ✅ Types TypeScript

**`src/lib/supabase/types.ts`**
- Type `plan` : `"creator" | "growth" | "scale"` (au lieu de `"free" | ...`)
- Appliqué sur Row, Insert, Update

**Tous les fichiers utilisant `PlanKey`**
- `src/app/(app)/settings/page.tsx` : ligne 54
- `src/components/settings/PricingSection.tsx` : ligne 22
- `src/lib/credits.ts` : ligne 44

---

### 3. ✅ Fallbacks par défaut

Tous les `?? "free"` → `?? "creator"` :

- `src/components/layout/Sidebar.tsx` : ligne 88
- `src/components/layout/TopBar.tsx` : ligne 68
- `src/hooks/useUpsellTrigger.ts` : ligne 43
- `src/app/api/stripe/buy-credits/route.ts` : ligne 40
- `src/app/(app)/settings/page.tsx` : lignes 212, 1015
- `src/app/(app)/profile/page.tsx` : ligne 159
- `src/lib/credits-context.tsx` : ligne 85
- `src/app/api/scripts/generate/route.ts` : ligne 58
- `src/lib/credits.ts` : ligne 53
- `src/app/api/videos/[id]/transcribe/route.ts` : ligne 27
- `src/app/api/videos/[id]/analyze/route.ts` : ligne 28
- `src/components/notifications/CreditsAlertWrapper.tsx` : ligne 20

---

### 4. ✅ Logique conditionnelle

**Conditions supprimées** :
- `currentPlan === "free"` → supprimé partout
- `currentPlan !== "free"` → remplacé par checks plus spécifiques ou supprimé
- `plan === "free"` dans les comparaisons

**Fichiers modifiés** :
- `src/app/(app)/settings/page.tsx` : lignes 223, 235, 325, 452
- `src/components/settings/PricingSection.tsx` : lignes 373, 380, 416
- `src/components/notifications/CreditsAlert.tsx` : lignes 70, 73

---

### 5. ✅ Onboarding

**`src/app/(onboarding)/onboarding/page.tsx`**
- Type du state : `"creator" | "growth" | "scale"` (ligne 43)
- Types de la fonction `StepPlanSelection` : mis à jour (lignes 480-481)
- Supprimé le plan "Free" de la grille des plans (lignes 486-494)
- Mis à jour le texte explicatif : "Tous les nouveaux utilisateurs commencent avec 7 jours d'essai gratuit du plan Creator"
- Supprimé la condition `selectedPlan !== "free"` (ligne 95)
- Tous les nouveaux users passent par Stripe Checkout avec trial

---

### 6. ✅ Webhooks Stripe

**`src/app/api/stripe/webhook/route.ts`**
- Lors de l'annulation d'abonnement :
  - **Avant** : downgrade vers "free" avec 50 BP cappés
  - **Maintenant** : downgrade vers "creator" avec 0 BP
  - `stripe_subscription_id` → `null`

---

### 7. ✅ Offres de rétention

**`src/app/api/stripe/retention-offer/route.ts`**
- Option "downgrade" :
  - **Avant** : downgrade vers "free" avec 50 BP
  - **Maintenant** : downgrade vers "creator" avec 0 BP
  - Bloque si l'utilisateur est déjà sur Creator

---

### 8. ✅ Upsell triggers

**`src/lib/upsell-triggers.ts`**
- `first_script_success` : eligiblePlans = ["creator"] (au lieu de ["free"])
- `first_analysis` : eligiblePlans = ["creator"] (au lieu de ["free", "creator"])
- `multi_feature_use` : eligiblePlans = ["creator"] (au lieu de ["free", "creator"])

---

### 9. ✅ Maps de crédits max

**Mises à jour** :
- `src/components/notifications/CreditsAlertWrapper.tsx` : ligne 7
- `src/app/(app)/settings/page.tsx` : ligne 133
- Fallback : 500 (au lieu de 50)

---

## Migration base de données

**Fichier créé** : `supabase/remove_free_plan.sql`

À exécuter dans Supabase SQL Editor :

```sql
-- 1. Migrer tous les users "free" vers "creator" (0 BP)
UPDATE public.profiles
SET plan = 'creator', credits = 0, updated_at = now()
WHERE plan = 'free';

-- 2. Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 3. Nouvelle contrainte CHECK (sans 'free')
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('creator', 'growth', 'scale'));

-- 4. Nouveau DEFAULT = 'creator'
ALTER TABLE public.profiles
ALTER COLUMN plan SET DEFAULT 'creator';

-- 5. Nouveaux crédits par défaut = 500 (trial Creator)
ALTER TABLE public.profiles
ALTER COLUMN credits SET DEFAULT 500;
```

---

## Nouveau modèle business

### Parcours utilisateur

1. **Inscription** → Plan Creator (trial 7j) + 500 BP
2. **Après 7 jours** :
   - Si CB ajoutée → Passe en Creator payant (recharge auto 500 BP/mois)
   - Si pas de CB → Reste sur Creator avec 0 BP (bloqué)
3. **Options de l'utilisateur avec 0 BP** :
   - Souscrire à Creator, Growth, ou Scale
   - Acheter des packs de BP à l'unité

### Quand un abonnement est annulé

- L'utilisateur retourne sur **Creator avec 0 BP**
- Pas de fonctionnalité (besoin de BP pour utiliser l'app)
- Peut réactiver Creator, upgrader vers Growth/Scale, ou acheter des packs

---

## Impact sur l'UI

### Avant
- 4 choix de plans : Free, Creator, Growth, Scale
- Free affiché partout (onboarding, settings, sidebar)
- Messages d'upsell ciblant les users free

### Maintenant
- 3 choix de plans : Creator, Growth, Scale
- Plan minimum = Creator (7j gratuits)
- Messages d'upsell ciblant Creator → Growth

---

## Vérifications nécessaires

### ✅ Code TypeScript
- Tous les types mis à jour
- Tous les fallbacks → "creator"
- Toutes les conditions "free" supprimées

### ⚠️ Base de données
- **Action requise** : Exécuter `supabase/remove_free_plan.sql`
- Migrera tous les users "free" existants vers "creator"
- Mettra à jour le schéma pour bloquer "free"

### 🧪 Tests recommandés
1. Créer un nouveau compte → doit être sur Creator avec trial
2. Laisser expirer le trial → doit passer à 0 BP
3. Annuler un abonnement → doit downgrade vers Creator 0 BP
4. Ouvrir `/settings` → ne doit voir que 3 plans
5. Vérifier la sidebar → le badge du plan doit afficher "Creator" minimum

---

## Note importante

Tous les utilisateurs actuellement sur "free" **doivent être migrés en base de données** vers "creator" avec 0 BP. Sans cette migration SQL, des erreurs TypeScript apparaîtront car le code s'attend maintenant uniquement à "creator" | "growth" | "scale".

**Action critique** : Exécuter `supabase/remove_free_plan.sql` dans Supabase SQL Editor avant de déployer.
