# 🎯 ACTIVATION DES TRIGGERS D'UPSELL

## ❌ STATUT ACTUEL : **PAS ENCORE ACTIVÉS**

L'infrastructure d'upsell est complète (modal, triggers, provider) MAIS les triggers ne sont **pas encore connectés** aux pages réelles. Il faut les intégrer manuellement.

---

## 📋 TRIGGERS DISPONIBLES

Voici tous les triggers définis dans `src/lib/upsell-triggers.ts` :

| Trigger ID | Moment | Eligible | Offer | Priorité |
|------------|--------|----------|-------|----------|
| `first_script_success` | Premier script généré | Free | Creator trial 7j | 100 |
| `script_streak` | 3+ scripts générés en 1 semaine | Free | Creator trial 7j | 90 |
| `radar_limit` | Atteint 10 créateurs (limite) | Creator | Growth -20% | 85 |
| `high_usage_week` | >80% BP utilisés en 1 semaine | Creator, Growth | Upgrade +1000 BP | 80 |
| `low_credits_script` | BP insuffisants pour scripter | Tous | Plan supérieur | 95 |
| `annual_pitch` | Après 3 mois d'abonnement | Tous mensuels | Annual -30% | 70 |
| `growth_after_creator` | 2 semaines sur Creator | Creator | Growth -20% | 75 |
| `video_analysis_tease` | Clique sur vidéo mais pas access | Free, Creator | Growth unlock | 88 |

---

## 🔧 COMMENT LES ACTIVER

### 1️⃣ Importer le hook dans la page

```typescript
import { useUpsell } from "@/components/upsell/UpsellProvider"

export default function MaPage() {
  const { triggerUpsell } = useUpsell()
  
  // ...
}
```

### 2️⃣ Appeler `triggerUpsell()` au bon moment

```typescript
// Exemple : Après génération d'un script
const handleGenerateScript = async () => {
  // ... logique de génération
  
  // Trigger upsell si c'est le 1er script
  if (isFirstScriptEver && profile?.plan === "free") {
    triggerUpsell("first_script_success")
  }
}
```

---

## 📍 INTÉGRATIONS À FAIRE (Page par page)

### ✅ `/board` (BrutBoard)

**Triggers à intégrer :**
- `first_script_success` : Après génération du 1er script
- `script_streak` : Après 3+ scripts en 1 semaine
- `low_credits_script` : Si BP insuffisants

**Fichier :** `src/app/(app)/board/page.tsx`

```typescript
// Dans le handler de génération de script
if (justGeneratedScript) {
  // Check si 1er script ever
  const isFirst = /* logique pour vérifier */
  if (isFirst && profile?.plan === "free") {
    triggerUpsell("first_script_success")
  }
  
  // Check streak (3+ scripts cette semaine)
  const recentScripts = /* fetch scripts des 7 derniers jours */
  if (recentScripts >= 3 && profile?.plan === "free") {
    triggerUpsell("script_streak")
  }
}

// Avant de générer un script
if (credits < COSTS.SCRIPT_GENERATION) {
  triggerUpsell("low_credits_script")
  return // Bloque l'action
}
```

---

### ✅ `/creators` (Radar)

**Triggers à intégrer :**
- `radar_limit` : Quand on atteint 10 créateurs sur Creator

**Fichier :** `src/app/(app)/creators/page.tsx`

```typescript
// Lors de l'ajout d'un créateur
const handleAddCreator = async (username: string) => {
  // ... logique d'ajout
  
  const currentCount = watchlist.length + 1 // +1 car on vient d'ajouter
  
  if (currentCount >= 10 && profile?.plan === "creator") {
    triggerUpsell("radar_limit")
  }
}
```

---

### ✅ `/creators/[id]` (Vidéo detail)

**Triggers à intégrer :**
- `video_analysis_tease` : Quand user clique sur analyse mais n'a pas accès

**Fichier :** `src/app/(app)/creators/[id]/page.tsx`

```typescript
// Quand l'user essaie d'accéder à l'analyse deep
const handleOpenAnalysis = () => {
  if (profile?.plan === "free" || profile?.plan === "creator") {
    triggerUpsell("video_analysis_tease")
    return // Bloque l'accès
  }
  
  // Ouvre le modal d'analyse
}
```

---

### ✅ `/home` (Dashboard)

**Triggers à intégrer :**
- `high_usage_week` : Si >80% BP utilisés cette semaine
- `growth_after_creator` : Après 2 semaines sur Creator
- `annual_pitch` : Après 3 mois sur un plan mensuel

**Fichier :** `src/app/(app)/home/page.tsx`

```typescript
useEffect(() => {
  if (!profile) return
  
  // High usage week
  const usagePercent = (weeklyUsage / maxCredits) * 100
  if (usagePercent > 80 && (profile.plan === "creator" || profile.plan === "growth")) {
    triggerUpsell("high_usage_week")
  }
  
  // Growth after Creator (2 weeks)
  const daysSinceCreator = /* calcul depuis created_at ou upgrade_at */
  if (daysSinceCreator >= 14 && profile.plan === "creator") {
    triggerUpsell("growth_after_creator")
  }
  
  // Annual pitch (3 months)
  const monthsSinceSubscription = /* calcul depuis subscription start */
  if (monthsSinceSubscription >= 3 && profile.interval === "month") {
    triggerUpsell("annual_pitch")
  }
}, [profile, weeklyUsage])
```

---

## 🚨 IMPORTANT : Cooldowns & Priorité

Les triggers ont des **cooldowns automatiques** (localStorage) pour ne pas spammer :
- Chaque trigger a un cooldown de **7 jours** par défaut
- Si 2+ triggers sont éligibles simultanément, seul celui avec la **plus haute priorité** s'affiche
- Le modal ne peut s'afficher que **1 fois à la fois** (pas de stacking)

### Logique gérée par `useUpsellTrigger` :

```typescript
// Avant d'afficher un trigger
const canShow = canShowTrigger(triggerType, profile.plan, shownHistory)

if (!canShow) {
  // Soit déjà montré récemment, soit plan pas eligible
  return
}

// Si OK → affiche le modal
```

---

## 🎨 UI DU MODAL

Le `UpsellModal` est déjà stylé et prêt :
- Animations Framer Motion (entrée/sortie fluide)
- Design premium (glow effects, gradients)
- Comparaison prix avant/après
- Liste de features avec checkmarks
- CTA irrésistible
- Urgency ("Offre limitée", "Seulement 48h")

**Voir :** `src/components/upsell/UpsellModal.tsx`

---

## 🧪 TESTER LES TRIGGERS

### Composant de test inclus :

`TestUpsellButton` (`src/components/upsell/TestUpsellButton.tsx`) affiche des boutons pour tester chaque trigger manuellement.

**Visible seulement en dev** (`NODE_ENV !== "production"`).

**Déjà intégré dans :** `src/app/(app)/layout.tsx`

---

## ✅ CHECKLIST D'INTÉGRATION

- [ ] `/board` → `first_script_success`, `script_streak`, `low_credits_script`
- [ ] `/creators` → `radar_limit`
- [ ] `/creators/[id]` → `video_analysis_tease`
- [ ] `/home` → `high_usage_week`, `growth_after_creator`, `annual_pitch`
- [ ] Tester chaque trigger avec `TestUpsellButton`
- [ ] Vérifier les cooldowns (localStorage)
- [ ] Tracker analytics (voir section suivante)

---

## 📊 ANALYTICS (TODO)

Pour mesurer l'efficacité des upsells :

### Dans `credit_transactions.action`, ajouter :
- `upsell_shown` (metadata: trigger type)
- `upsell_accepted` (metadata: trigger type, offer type)
- `upsell_dismissed` (metadata: trigger type)

### Dashboard analytics :
- **Taux de conversion par trigger** : % d'acceptation
- **Revenue généré par trigger** : MRR uplift
- **Triggers les plus efficaces** : Classement par conversion

---

## 🚀 PRIORITÉ D'INTÉGRATION

**Phase 1 (Quick Wins)** :
1. ✅ `/board` → `first_script_success` (conversion élevée attendue)
2. ✅ `/board` → `low_credits_script` (moment d'urgence)
3. ✅ `/creators` → `radar_limit` (friction → upsell naturel)

**Phase 2 (Advanced)** :
4. ✅ `/creators/[id]` → `video_analysis_tease`
5. ✅ `/home` → `high_usage_week`
6. ✅ `/home` → `growth_after_creator`

**Phase 3 (Long-term)** :
7. ✅ `/home` → `annual_pitch` (après 3 mois)

---

## 💡 IDÉES DE TRIGGERS SUPPLÉMENTAIRES

Si ces triggers fonctionnent bien, on peut ajouter :

- `onboarding_incomplete` : Si l'user n'a pas fini l'onboarding après 3j
- `inactive_7_days` : Si pas de connexion depuis 7j
- `competitor_mention` : Si l'user mentionne un concurrent dans le feedback
- `power_user` : Si >50 scripts générés en 1 mois (pitch Scale)
- `team_invite` : Si l'user invite un autre user (pitch Scale pour teams)

---

**Tout est prêt, il suffit d'activer !** 🔥
