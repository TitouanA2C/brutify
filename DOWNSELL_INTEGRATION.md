# 🚀 SYSTÈME ANTI-CHURN (DOWNSELL) — Intégré

## ✅ Implémenté :

### 1. `RetentionModal` (`src/components/retention/RetentionModal.tsx`)

Modal premium avec **3 offres anti-churn** :

| Offre | Description | Réduction | Badge |
|-------|-------------|-----------|-------|
| **-50% pendant 3 mois** | Garde toutes les features au prix divisé par 2 | 50% | MEILLEURE OFFRE |
| **Pause de 2 mois** | Suspension de l'abonnement sans perte de données | 100% pendant 2 mois | - |
| **Downgrade vers Free** | Retour au plan gratuit avec 50 BP | 100% permanent | - |

### 2. `/api/stripe/retention-offer/route.ts`

API pour appliquer les offres côté Stripe :

- **Discount (-50%)** : Crée un coupon Stripe -50% valable 3 mois
- **Pause** : Utilise `pause_collection` avec `resumes_at` dans 2 mois
- **Downgrade** : Cancel la subscription Stripe + mise à jour du profil en Free (50 BP)

### 3. Intégration dans `settings/page.tsx`

- **Nouveau bouton** : "Gérer · Résilier" → ouvre `RetentionModal` (au lieu du portal)
- **Flow** :
  1. User clique sur "Résilier"
  2. → `RetentionModal` s'affiche
  3. → User choisit une offre OU refuse toutes
  4. → Si offre acceptée : API `/retention-offer` + refresh profile
  5. → Si refuse toutes : Stripe Portal s'ouvre (cancel classique)

---

## 📊 Logique de rétention

### Marge vs. Churn

- **Creator** : 19€/mois → -50% = **9.50€/mois** (pendant 3 mois)
  - Coût API : ~6€/mois pour 500 BP utilisés
  - **Marge : ~36%** (vs. 68% en temps normal)
- **Growth** : 39€/mois → -50% = **19.50€/mois**
  - Coût API : ~12€/mois pour 2000 BP utilisés
  - **Marge : ~38%**
- **Scale** : 79€/mois → -50% = **39.50€/mois**
  - Coût API : ~36€/mois pour 6000 BP utilisés
  - **Marge : ~9%**

**Trade-off** : Réduire la marge à 50% du tarif = garder l'user pour 3 mois au lieu de le perdre à jamais. Après 3 mois, retour au tarif normal.

---

## 🎯 Prochaine étape : Tracking Analytics

Pour mesurer l'efficacité du downsell, il faut tracker :

1. **Taux de rétention** : % d'users qui acceptent une offre vs. qui cancel vraiment
2. **Offre préférée** : Quelle offre est la plus acceptée ?
3. **LTV uplift** : Combien d'€ de MRR sauvés grâce aux retention offers ?

Ajouter dans `credit_transactions.action` :
- `retention_discount_accepted`
- `retention_pause_accepted`
- `retention_downgrade_accepted`
- `retention_all_refused`

Puis créer un dashboard analytics dans `/settings` (onglet admin) pour visualiser ces metrics.

---

## ✅ Testé en local ?

**NON** — nécessite Stripe en mode test.

### Pour tester :

1. Crée un user avec un plan actif (Creator, Growth ou Scale)
2. Va dans Settings > Abonnement
3. Clique sur "Gérer · Résilier"
4. → Le modal s'affiche avec les 3 offres
5. Clique sur une offre → API appelle Stripe
6. Vérifie dans Stripe Dashboard (mode test) que le coupon/pause a été appliqué

---

## 📝 Notes importantes

- Le modal ne s'affiche **que pour les users avec un abonnement actif**
- Les users Free n'ont rien à résilier → bouton "Gérer" ouvre directement le portal (pas de modal)
- L'offre **-50% pendant 3 mois** est la plus agressive pour maximiser la rétention
- Après les 3 mois, Stripe facture automatiquement au tarif normal (pas besoin de logique supplémentaire)
