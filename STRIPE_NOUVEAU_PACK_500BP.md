# 🎯 Nouveau pack 500 BP — Instructions Stripe

## Stratégie marketing

Le nouveau pack **500 BP à 25€** (5.0 cts/BP) est un **sweet spot psychologique** :

- ✅ Plus accessible que le 1000 BP (59€)
- ✅ Reste plus cher que l'abonnement Creator (3.8 cts/BP) → pousse vers l'abo
- ✅ Badge "POPULAIRE" pour attirer l'œil
- ✅ Créé un ancrage intermédiaire parfait

---

## Création dans Stripe Dashboard

### 1️⃣ Créer le produit

1. Va sur **Stripe Dashboard** → **Catalogue de produits** → **Créer un produit**
2. Remplis :
   - **Nom** : `Brutify 500 BP`
   - **Description** (optionnelle) : "Pack de 500 BrutPoints pour créateurs sérieux"
   - **Mode de tarification** : **Paiement unique**
   - **Prix** : `25.00` EUR
3. **Enregistrer le produit**

### 2️⃣ Récupérer le Price ID

1. Ouvre le produit `Brutify 500 BP` que tu viens de créer
2. Section **Tarifs** → clique sur le prix (`25,00 €`)
3. Copie l'ID qui commence par `price_...` (exemple : `price_1T7i45F8GNIszQ5sXXXXX`)

### 3️⃣ Configurer l'environnement

**Local (`.env.local`)** :
```env
STRIPE_CREDITS_500_PRICE_ID=price_... # colle ton Price ID ici
```

**Production (Vercel)** :
1. Dashboard Vercel → ton projet → **Settings** → **Environment Variables**
2. Ajoute :
   - Name: `STRIPE_CREDITS_500_PRICE_ID`
   - Value: `price_...`
   - Environments: **Production**, **Preview**, **Development**

### 4️⃣ Redéploie (si nécessaire)

Si ton app est déjà en prod sur Vercel :
```bash
git add .
git commit -m "feat: ajout pack 500 BP + bonus 1000→1200"
git push
```

Vercel redéploiera automatiquement avec les nouvelles variables.

---

## Résumé des packs (nouvelle structure)

| Pack | Prix | BP réels crédités | €/BP | Badge | Conversion goal |
|------|------|-------------------|------|-------|-----------------|
| 100 BP | 9€ | 100 | 9.0 cts | — | Ancrage haut |
| 300 BP | 22€ | 300 | 7.3 cts | — | Ancrage moyen |
| **500 BP** | **25€** | **500** | **5.0 cts** | **POPULAIRE** | **Quick refill accessible** |
| 1000 BP | 59€ | **1200** (+200 bonus) | 4.9 cts | +20% OFFERT | Best one-time deal |

**Creator (abo)** = 19€/mois pour 500 BP → **3.8 cts/BP** ← Reste le meilleur deal 🎯

---

## Test en local

```bash
# 1. Lance le serveur
npm run dev

# 2. Va sur http://localhost:3000/settings
# 3. Section "Acheter des BrutPoints" → tu verras le nouveau pack 500 BP avec badge "POPULAIRE"
# 4. Clique dessus → Stripe Checkout s'ouvre
# 5. Utilise la carte test : 4242 4242 4242 4242
# 6. Vérifie que ton compte est bien crédité de 500 BP
```

---

🎉 **Stratégie implémentée !** Le nouveau pack et le bonus +20% vont booster la conversion.
