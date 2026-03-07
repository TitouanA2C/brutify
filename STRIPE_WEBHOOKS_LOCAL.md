# 🔌 WEBHOOKS STRIPE EN LOCAL — Guide complet

## 🚨 Problème actuel

Les webhooks Stripe **échouent en local** :
```
[Stripe Webhook] Verification failed: No signatures found matching the expected signature
```

**Pourquoi ?** Stripe ne peut pas envoyer de webhooks à `localhost:3000`.

---

## ✅ Solution 1 : Stripe CLI (RECOMMANDÉ)

### 1. **Installer Stripe CLI**

**Windows (PowerShell Admin) :**
```powershell
scoop install stripe
```

**OU télécharge directement :**
https://github.com/stripe/stripe-cli/releases/latest

### 2. **Login avec ton compte Stripe**

```bash
stripe login
```

Une fenêtre de navigateur s'ouvre → confirme l'accès

### 3. **Forward les webhooks vers ton localhost**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Tu verras :
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

### 4. **Copie le nouveau webhook secret**

Stripe CLI te donne un **nouveau secret** (commence par `whsec_`).

**Remplace dans `.env.local` :**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # ← Le nouveau secret du CLI
```

### 5. **Relance ton serveur Next.js**

```bash
npm run dev
```

### 6. **Teste un achat**

Maintenant, quand tu achètes des BP :
- Stripe envoie le webhook → Stripe CLI
- Stripe CLI forward → `localhost:3000/api/stripe/webhook`
- Le webhook crédite tes BP ✅

---

## ✅ Solution 2 : Mode dev sans vérification (RAPIDE)

Si tu veux juste tester rapidement, on peut **temporairement désactiver** la vérification de signature en dev.

### Modifier `src/app/api/stripe/webhook/route.ts` :

```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const sig = headers().get("stripe-signature")

  let event: Stripe.Event

  // ⚠️ EN DEV : skip la vérification pour tester
  if (process.env.NODE_ENV === "development" && !sig) {
    event = JSON.parse(body) as Stripe.Event
  } else {
    if (!sig) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 })
    }
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signature invalide"
      console.error("[Stripe Webhook] Verification failed:", message)
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }
  
  // ... reste du code
}
```

**⚠️ Attention :** Cette solution est **temporaire** pour tester. En production, les webhooks doivent TOUJOURS être vérifiés.

---

## ✅ Solution 3 : Créditer manuellement (TEST ULTRA RAPIDE)

Pour tester immédiatement sans configurer les webhooks :

### Requête SQL dans Supabase :

```sql
-- Créditer 100 BP à ton user
UPDATE profiles
SET credits = credits + 100
WHERE id = 'TON_USER_ID';

-- Logger la transaction
INSERT INTO credit_transactions (user_id, amount, action, reference_id)
VALUES ('TON_USER_ID', 100, 'credit_purchase', 'manual_test_001');
```

---

## 🎯 Quelle solution tu préfères ?

**Option A** : J'installe Stripe CLI et je configure tout (2-3 min)  
**Option B** : Je désactive temporairement la vérification de signature en dev  
**Option C** : Je crédite manuellement via SQL pour tester maintenant

Dis-moi ton choix !
