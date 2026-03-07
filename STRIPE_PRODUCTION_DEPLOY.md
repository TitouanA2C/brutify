# 🚀 DÉPLOIEMENT STRIPE EN PRODUCTION

## ✅ Résumé : Oui, ça fonctionnera en production !

Le système actuel est conçu pour fonctionner en **dev ET prod** :

- **En dev (localhost)** : Workaround avec `/api/stripe/dev-credit` pour créditer les BP
- **En prod (Vercel)** : Les vrais webhooks Stripe créditent automatiquement les BP

---

## 📋 CHECKLIST AVANT LE DÉPLOIEMENT

### 1. **Activer le mode Production sur Stripe**

Va sur : https://dashboard.stripe.com/

- Passe du mode **Test** au mode **Live** (toggle en haut à gauche)
- Récupère tes **clés de production** :
  - Secret key : `sk_live_xxxxx`
  - Publishable key : `pk_live_xxxxx`

### 2. **Mettre les variables d'environnement sur Vercel**

Dans ton projet Vercel → Settings → Environment Variables :

```bash
# Stripe Production
STRIPE_SECRET_KEY=sk_live_xxxxx  # ← Clé LIVE (pas test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # ← Clé LIVE
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # ← À configurer après (étape 4)

# Tous les Price IDs en mode LIVE (à recréer)
STRIPE_CREATOR_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_CREATOR_YEARLY_PRICE_ID=price_xxxxx
STRIPE_GROWTH_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_GROWTH_YEARLY_PRICE_ID=price_xxxxx
STRIPE_SCALE_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_SCALE_YEARLY_PRICE_ID=price_xxxxx
STRIPE_CREDITS_100_PRICE_ID=price_xxxxx
STRIPE_CREDITS_300_PRICE_ID=price_xxxxx
STRIPE_CREDITS_500_PRICE_ID=price_xxxxx
STRIPE_CREDITS_1000_PRICE_ID=price_xxxxx

# Autres vars
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
APIFY_API_KEY=...
```

### 3. **Recréer tous les produits en mode LIVE**

⚠️ **Important** : Les produits créés en mode Test n'existent PAS en mode Live.

Tu dois **recréer les 10 produits** en mode Live :

| Produit | Prix |
|---------|------|
| Brutify Creator (mensuel) | 19€/mois |
| Brutify Creator (annuel) | 168€/an (14€/mois) |
| Brutify Growth (mensuel) | 39€/mois |
| Brutify Growth (annuel) | 336€/an (28€/mois) |
| Brutify Scale (mensuel) | 79€/mois |
| Brutify Scale (annuel) | 684€/an (57€/mois) |
| Brutify 100 BP | 9€ |
| Brutify 300 BP | 22€ |
| Brutify 500 BP | 25€ |
| Brutify 1000 BP | 59€ (crédite 1200 BP) |

**Utilise le guide :** `STRIPE_SETUP.md` (mêmes étapes, mode Live)

### 4. **Configurer le webhook en production**

#### A. Créer un endpoint webhook sur Stripe

1. Va sur : https://dashboard.stripe.com/webhooks
2. Clique sur **"Add endpoint"**
3. Entre ton URL de production :
   ```
   https://tondomaine.vercel.app/api/stripe/webhook
   ```
4. Sélectionne les événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Clique sur **"Add endpoint"**

#### B. Récupérer le webhook secret

Une fois créé, Stripe te donne un **Signing secret** (commence par `whsec_`).

**Copie-le** et ajoute-le dans Vercel :
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### C. Redéployer sur Vercel

Les nouvelles env vars nécessitent un redéploiement :
```bash
git push
```

Vercel redéploiera automatiquement avec les nouvelles variables.

---

## 🧪 Tester en production

### Test sans argent réel :

Même en mode Live, tu peux tester avec des cartes de test :

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi (mode test uniquement) |

**⚠️ En prod Live, seules les vraies cartes fonctionnent !**

### Workflow de test sécurisé :

1. **Reste en mode Test** jusqu'à ce que tout soit validé
2. **Configure les webhooks de test** avec Stripe CLI (pour dev)
3. **Valide tous les flux** (achat BP, upgrade, downgrade, cancel)
4. **Passe en Live** seulement quand tout est OK
5. **Teste avec une vraie carte** (1€ pour vérifier)
6. **Rembourse le test** dans Stripe Dashboard

---

## 🔐 Sécurité en production

### Le code actuel est déjà sécurisé :

✅ **Vérification de signature webhook** (sauf en dev)
```typescript
if (process.env.NODE_ENV === "development" && !sig) {
  // Skip en dev seulement
} else {
  // Vérification stricte en prod
  event = stripe.webhooks.constructEvent(body, sig, secret)
}
```

✅ **Endpoint `/api/stripe/dev-credit` n'est jamais appelé en prod**
```typescript
// L'URL success_url n'ajoute "dev_credit=true" que pour les tests
// En prod, les webhooks Stripe feront le travail
```

✅ **Toutes les actions sont loggées** dans `credit_transactions`

✅ **Métadonnées Stripe** incluent `supabase_user_id` pour tracer chaque transaction

---

## 📊 Monitoring en production

Une fois en Live, tu pourras suivre :

### Dans Stripe Dashboard :
- **Payments** : Tous les paiements réussis/échoués
- **Subscriptions** : Abonnements actifs/annulés
- **Webhooks** : Statut de chaque webhook (200 OK ou erreur)

### Dans Supabase :
- **Table `credit_transactions`** : Historique de toutes les transactions BP
- **Table `profiles`** : Crédits et plans de chaque user

---

## 🚨 Points d'attention au déploiement :

### 1. **Price IDs différents**
Les Price IDs en mode Test (`price_1T7i...`) sont **différents** des Price IDs Live.

**Action :** Recréer tous les produits en Live et mettre à jour les env vars.

### 2. **Webhook secret différent**
Le `STRIPE_WEBHOOK_SECRET` en Test est différent du Live.

**Action :** Configurer un nouveau webhook endpoint en Live et copier le nouveau secret.

### 3. **KYC Stripe**
Pour recevoir des paiements réels, Stripe demandera :
- Infos de ton entreprise (SIRET, KBIS)
- Coordonnées bancaires (pour recevoir les payouts)
- Identité du représentant légal

**Action :** Compléter le formulaire dans Stripe Dashboard > Settings > Business details

---

## ✅ RÉSUMÉ : Est-ce que ça marchera en prod ?

**OUI**, voici pourquoi :

| Feature | Dev (actuel) | Prod (après config) |
|---------|--------------|---------------------|
| Achats BP | ✅ Workaround manuel | ✅ Webhooks auto |
| Upgrades | ✅ Proration Stripe | ✅ Proration Stripe |
| Réductions abonnés | ✅ Coupons dynamiques | ✅ Coupons dynamiques |
| Anti-churn | ✅ Retention offers | ✅ Retention offers |
| Sécurité | ⚠️ Signature skippée | ✅ Signature vérifiée |

---

## 📝 Checklist déploiement (quand tu seras prêt) :

- [ ] Activer mode Live sur Stripe
- [ ] Récupérer clés Live (secret + publishable)
- [ ] Recréer les 10 produits en Live
- [ ] Configurer webhook endpoint vers ton URL Vercel
- [ ] Copier le nouveau webhook secret
- [ ] Ajouter toutes les env vars dans Vercel
- [ ] Déployer sur Vercel
- [ ] Tester un achat réel (1€)
- [ ] Vérifier que le webhook est bien reçu (Stripe Dashboard)
- [ ] Vérifier que les BP sont crédités (Supabase)

---

**En gros : le code est prêt, il suffira de configurer Stripe en mode Live et les webhooks pointeront vers ton URL publique.** ✅

Tu veux que je crée un script d'aide pour automatiser la création des produits en Live ?