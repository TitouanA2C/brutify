# Configuration des coupons Stripe pour les codes promo

## 🎯 Coupons à créer dans le Dashboard Stripe

Les codes promo Brutify nécessitent des coupons Stripe correspondants. Voici comment les créer :

### 1. CREATOR15 (Plan Creator -15%)
- **ID du coupon** : `CREATOR15`
- **Type** : Pourcentage
- **Valeur** : 15%
- **Durée** : Once (une seule fois, sur la 1ère facture)
- **Nom** : Promo Creator -15%
- **Description** : -15% sur le 1er mois Creator

### 2. TRIALGROWTH30 (Plan Growth -30%)
- **ID du coupon** : `TRIALGROWTH30`
- **Type** : Pourcentage
- **Valeur** : 30%
- **Durée** : Once (une seule fois, sur la 1ère facture)
- **Nom** : Promo Trial Growth -30%
- **Description** : -30% sur le 1er mois Growth (offre trial exclusive)

### 3. GROWTH20 (Plan Growth -20%)
- **ID du coupon** : `GROWTH20`
- **Type** : Pourcentage
- **Valeur** : 20%
- **Durée** : Once (une seule fois, sur la 1ère facture)
- **Nom** : Promo Growth -20%
- **Description** : -20% sur le 1er mois Growth

### 4. TRIAL7 (7 jours d'essai)
⚠️ **Ce code est géré automatiquement via `trial_period_days` dans Stripe**
Pas besoin de créer un coupon pour celui-ci.

### 5. SCALEBONUS (+1000 BP offerts)
⚠️ **Ce code sera géré via webhook après paiement**
Pas besoin de créer un coupon pour celui-ci (bonus BP crédité après souscription).

---

## 📝 Commandes pour créer les coupons via Stripe CLI

Si tu as installé Stripe CLI, tu peux créer les coupons rapidement :

```bash
# CREATOR15
stripe coupons create \
  --id CREATOR15 \
  --percent-off 15 \
  --duration once \
  --name "Promo Creator -15%"

# TRIALGROWTH30
stripe coupons create \
  --id TRIALGROWTH30 \
  --percent-off 30 \
  --duration once \
  --name "Promo Trial Growth -30%"

# GROWTH20
stripe coupons create \
  --id GROWTH20 \
  --percent-off 20 \
  --duration once \
  --name "Promo Growth -20%"
```

---

## 🔄 Création automatique

**Bonne nouvelle** : Le code backend crée automatiquement les coupons s'ils n'existent pas encore lors du premier checkout avec un code promo.

Néanmoins, pour une meilleure gestion et tracking, il est recommandé de les créer manuellement dans le Dashboard Stripe.

---

## ✅ Vérifier que ça fonctionne

1. Va sur `/settings?tab=abonnement&promo=CREATOR15`
2. Le prix du plan Creator devrait afficher **16€** au lieu de **19€**
3. Clique sur "Payer"
4. Sur la page Stripe Checkout, le prix devrait être **16€** avec une ligne "Promo Creator -15%" visible
5. Après paiement, la facture devrait montrer la réduction appliquée

---

## 📊 Flux technique

1. **URL** : `/settings?tab=abonnement&promo=CREATOR15`
2. **Frontend** : Détecte le promo, affiche prix réduit
3. **Click "Payer"** : Envoie `{ plan: "creator", interval: "month", promoCode: "CREATOR15" }`
4. **API `/api/stripe/checkout`** : 
   - Récupère le coupon Stripe via `getPromoCoupon("CREATOR15")` → `"CREATOR15"`
   - Applique `discounts: [{ coupon: "CREATOR15" }]` à la session Stripe
   - Si le coupon n'existe pas, le crée automatiquement
5. **Stripe Checkout** : Affiche le prix avec réduction
6. **Webhook** : Enregistre la souscription avec le coupon appliqué
