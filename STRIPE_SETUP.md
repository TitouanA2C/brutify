# Guide d'intégration Stripe — Brutify

## Vue d'ensemble

L'infrastructure Stripe est **déjà codée** dans le projet. Il ne reste qu'à :
1. Créer les produits dans le Dashboard Stripe
2. Récupérer les Price IDs
3. Renseigner les variables d'environnement
4. Configurer le webhook

---

## Étape 1 — Créer ton compte Stripe

1. Va sur **https://stripe.com** → crée un compte
2. Mode **test** pour le dev, mode **live** pour la prod
3. Accède au Dashboard → tu dois voir la page d'accueil

---

## Étape 2 — Récupérer tes clés API

Va sur **Dashboard → Développeurs → Clés API**

Tu as deux types de clés :
- **Publishable key** : commence par `pk_test_` ou `pk_live_` — côté client (pas utilisée dans Brutify pour l'instant)
- **Secret key** : commence par `sk_test_` ou `sk_live_` — **c'est celle qu'il te faut**

→ Copie la **Secret key** et note-la, tu en auras besoin à l'Étape 4.

---

## Étape 3 — Créer les produits et prix

Va sur **Dashboard → Catalogue de produits → + Ajouter un produit**

### 3.1 — Plan Creator (abonnement)

**Crée le produit :**
- Nom : `Brutify Creator`
- Description : `500 BP / mois · Scripts IA · BrutBoard`
- Mode de facturation : **Abonnement (recurring)**

**Ajoute 2 prix sur ce produit :**

| | Prix | Fréquence | Env var à remplir |
|---|---|---|---|
| Mensuel | **19,00 €** | Toutes les semaines = mensuel | `STRIPE_CREATOR_MONTHLY_PRICE_ID` |
| Annuel | **168,00 €** | Tous les ans (= 14€/mois) | `STRIPE_CREATOR_YEARLY_PRICE_ID` |

---

### 3.2 — Plan Growth (abonnement)

**Crée le produit :**
- Nom : `Brutify Growth`
- Description : `2 000 BP / mois · Analyse IA · Transcription`
- Mode de facturation : **Abonnement (recurring)**

**Ajoute 2 prix :**

| | Prix | Fréquence | Env var |
|---|---|---|---|
| Mensuel | **39,00 €** | Mensuel | `STRIPE_GROWTH_MONTHLY_PRICE_ID` |
| Annuel | **336,00 €** | Annuel (= 28€/mois) | `STRIPE_GROWTH_YEARLY_PRICE_ID` |

---

### 3.3 — Plan Scale (abonnement)

**Crée le produit :**
- Nom : `Brutify Scale`
- Description : `6 000 BP / mois · Multi-users · Export`
- Mode de facturation : **Abonnement (recurring)**

**Ajoute 2 prix :**

| | Prix | Fréquence | Env var |
|---|---|---|---|
| Mensuel | **79,00 €** | Mensuel | `STRIPE_SCALE_MONTHLY_PRICE_ID` |
| Annuel | **684,00 €** | Annuel (= 57€/mois) | `STRIPE_SCALE_YEARLY_PRICE_ID` |

---

### 3.4 — Packs BP (paiements uniques)

Ces produits ont le mode **Paiement unique** (pas récurrent).

**Crée 4 produits séparés :**

| Produit | Prix | Mode | Env var |
|---|---|---|---|
| `Brutify 100 BP` | **9,00 €** | Paiement unique | `STRIPE_CREDITS_100_PRICE_ID` |
| `Brutify 300 BP` | **22,00 €** | Paiement unique | `STRIPE_CREDITS_300_PRICE_ID` |
| `Brutify 500 BP` | **25,00 €** | Paiement unique | `STRIPE_CREDITS_500_PRICE_ID` |
| `Brutify 1000 BP` *(crédite 1200 BP)* | **59,00 €** | Paiement unique | `STRIPE_CREDITS_1000_PRICE_ID` |

---

## Étape 4 — Renseigner les variables d'environnement

### En local — crée/modifie le fichier `.env.local` à la racine du projet :

```env
# ── Supabase (déjà configuré normalement) ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Stripe ─────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...          # Dashboard → Développeurs → Clés API
STRIPE_WEBHOOK_SECRET=whsec_...        # Dashboard → Développeurs → Webhooks (voir Étape 5)

# Plans — Price IDs (récupérés depuis chaque produit créé)
STRIPE_CREATOR_MONTHLY_PRICE_ID=price_...
STRIPE_CREATOR_YEARLY_PRICE_ID=price_...
STRIPE_GROWTH_MONTHLY_PRICE_ID=price_...
STRIPE_GROWTH_YEARLY_PRICE_ID=price_...
STRIPE_SCALE_MONTHLY_PRICE_ID=price_...
STRIPE_SCALE_YEARLY_PRICE_ID=price_...

# Packs BP (paiements uniques)
STRIPE_CREDITS_100_PRICE_ID=price_...
STRIPE_CREDITS_300_PRICE_ID=price_...
STRIPE_CREDITS_500_PRICE_ID=price_...
STRIPE_CREDITS_1000_PRICE_ID=price_...

# ── AI / Scraping ───────────────────────────────────────────────────────────
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
APIFY_API_TOKEN=apify_api_...
```

### Sur Vercel (production)

Va sur **Vercel → ton projet → Settings → Environment Variables**  
Ajoute toutes les variables ci-dessus avec les valeurs **live** (pas test) :
- `STRIPE_SECRET_KEY` → commence par `sk_live_`
- `STRIPE_WEBHOOK_SECRET` → le secret du webhook **prod** (voir Étape 5)
- Tous les `STRIPE_..._PRICE_ID` → les Price IDs du mode **live**

---

## Étape 5 — Configurer le Webhook

> Le webhook est ce qui permet à Stripe d'informer Brutify qu'un paiement a eu lieu. C'est ce qui active/renouvelle les abonnements et crédite les BP en base de données.

### En local (développement)

1. **Installe la Stripe CLI :**
   ```bash
   # Windows (avec winget)
   winget install Stripe.StripeCLI
   
   # ou télécharge ici : https://stripe.com/docs/stripe-cli
   ```

2. **Connecte-toi :**
   ```bash
   stripe login
   ```

3. **Écoute les webhooks en local :**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   → Il affiche un `whsec_...` : copie-le dans `STRIPE_WEBHOOK_SECRET` de ton `.env.local`

4. **Dans un autre terminal, lance le projet :**
   ```bash
   npm run dev
   ```

5. **Pour tester un paiement :**
   ```bash
   stripe trigger checkout.session.completed
   ```

### En production (Vercel)

1. Va sur **Dashboard Stripe → Développeurs → Webhooks → + Ajouter un endpoint**

2. **URL de l'endpoint :**
   ```
   https://TON-APP.vercel.app/api/stripe/webhook
   ```

3. **Events à écouter** — sélectionne exactement ces 4 :
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. **Clique sur "Ajouter un endpoint"**

5. Clique sur ton endpoint créé → copie le **Signing secret** (`whsec_...`)  
   → Ajoute-le dans Vercel sous le nom `STRIPE_WEBHOOK_SECRET`

---

## Étape 6 — Tester le flux complet

### Cartes de test Stripe

En mode test, utilise ces cartes :
| Scénario | Numéro carte | Date | CVV |
|---|---|---|---|
| Paiement réussi | `4242 4242 4242 4242` | N'importe quelle date future | N'importe |
| Refus | `4000 0000 0000 9995` | — | — |
| 3D Secure | `4000 0025 0000 3155` | — | — |

### Flux à tester

1. **Inscription** → `/signup` → entre un email/mdp → vérifie l'onboarding
2. **Upgrade plan** → `/settings` → onglet Abonnement → clique "Passer en Creator" → entre `4242...` → vérifie que le profil dans Supabase est mis à jour (plan = "creator", credits = 500)
3. **Achat BP** → bouton pack → entre `4242...` → vérifie que les credits ont augmenté
4. **Portail de gestion** → bouton "Gérer" dans l'onglet Abonnement → vérifie que le portail Stripe s'ouvre
5. **Renouvellement** → dans Stripe CLI : `stripe trigger invoice.paid --add invoice:billing_reason=subscription_cycle`

---

## Flux utilisateur complet dans Brutify

```
Landing page
    ↓
"Essai gratuit" → /signup
    ↓
Création compte Supabase (50 BP offerts)
    ↓
/onboarding (choix niche, handles Instagram, créateurs suggérés)
    ↓
/home (dashboard)
    ↓
Utilise les features → consomme les 50 BP
    ↓
Credits épuisés → settings/abonnement
    ↓
Clique "Passer en Creator" → Stripe Checkout
    ↓
Paiement → webhook → plan = "creator", credits = 500
    ↓
Retour sur /settings?success=true
```

---

## Architecture technique (pour référence)

| Route | Rôle |
|---|---|
| `POST /api/stripe/checkout` | Crée une session Stripe Checkout pour un abonnement |
| `POST /api/stripe/buy-credits` | Crée une session Stripe Checkout pour un pack BP (one-time) |
| `POST /api/stripe/webhook` | Reçoit les événements Stripe et met à jour Supabase |
| `POST /api/stripe/portal` | Crée une session Stripe Billing Portal pour gérer l'abonnement |

| Événement Stripe | Action dans Supabase |
|---|---|
| `checkout.session.completed` (subscription) | Met à jour `plan`, `credits`, `stripe_subscription_id` |
| `checkout.session.completed` (credits) | Ajoute les BP au solde |
| `invoice.paid` (subscription_cycle) | Reset mensuel des BP |
| `customer.subscription.updated` | Change de plan |
| `customer.subscription.deleted` | Repasse en "free", cap credits à 50 |
