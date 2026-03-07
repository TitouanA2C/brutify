# 🎨 PERSONNALISATION DE STRIPE CHECKOUT

## ✅ Déjà implémenté (dans le code) :

- Message personnalisé sous le bouton de paiement
- Collection automatique de l'adresse de facturation
- Téléphone désactivé (pour UX rapide)

---

## 🎨 Personnalisation avancée (Dashboard Stripe)

Pour personnaliser **complètement** la page Checkout (logo, couleurs, icône) :

### 1. **Va dans les Paramètres Branding**

**URL :** https://dashboard.stripe.com/settings/branding

### 2. **Logo & Icône**

#### Logo (affiché en haut de la page Checkout)
- **Dimensions recommandées** : 200-400px de largeur, fond transparent
- **Format** : PNG ou SVG
- **Upload** : Section "Brand icon and logo"

#### Icône (favicon, petit logo carré)
- **Dimensions** : 128x128px minimum
- **Format** : PNG, fond transparent
- **Utilisé pour** : Favicon, emails, receipts

### 3. **Couleurs de la marque**

#### Accent color (couleur principale)
- **Brutify Gold** : `#FFAB00`
- **Utilisé pour** : Boutons, liens, accents

### 4. **Police de caractères** (optionnel)

Tu peux choisir parmi :
- Roboto
- Lato
- Montserrat
- etc.

---

## 🖼️ Exemples de personnalisation

### Logo Brutify :

Si tu n'as pas encore de logo, voici ce que tu peux utiliser :

**Option A** : Logo texte avec police brutale (comme ton app)
- Texte : "BRUTIFY" en `Bebas Neue` ou `Oswald`
- Couleur : Gold gradient (`#FFAB00` → `#FF8800`)
- Fond : Transparent

**Option B** : Logo + icône
- Icône : Sparkles ⚡ stylisé en gold
- Texte : "BRUTIFY" à côté

---

## 📧 Personnalisation des emails

Stripe envoie automatiquement des emails (reçus, confirmations). Pour les personnaliser :

**URL :** https://dashboard.stripe.com/settings/emails

Options disponibles :
- Logo dans les emails
- Couleur de marque
- Adresse email "From" custom (ex: `team@brutify.com`)
- Footer personnalisé

---

## 🧪 Tester la personnalisation

1. Configure le branding dans le Dashboard
2. Relance un test d'achat (`4242 4242 4242 4242`)
3. Vérifie que :
   - ✅ Le logo Brutify apparaît en haut
   - ✅ Les boutons sont en gold (`#FFAB00`)
   - ✅ Le message personnalisé s'affiche
   - ✅ L'email de confirmation a ton branding

---

## 💡 Options avancées (dans le code)

Tu peux ajouter d'autres personnalisations via l'API :

### Descriptions enrichies :

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  line_items: [{
    price: pack.priceId,
    quantity: 1,
  }],
  
  // Ajouter une description visible
  custom_text: {
    submit: {
      message: "🎯 Vos BrutPoints seront crédités instantanément après paiement.",
    },
    // Message après paiement
    after_submit: {
      message: "🚀 Vos crédits sont disponibles ! Retournez sur Brutify pour créer du contenu viral.",
    },
  },
})
```

### Permettre codes promo :

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  allow_promotion_codes: true, // Active le champ pour codes promo
})
```

### Champs custom :

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  custom_fields: [
    {
      key: "instagram_handle",
      label: { type: "custom", custom: "Ton @Instagram (optionnel)" },
      type: "text",
      optional: true,
    },
  ],
})
```

---

## 🎯 Configuration recommandée pour Brutify :

### Dans Dashboard Stripe :
1. ✅ Logo Brutify (texte gold sur fond transparent)
2. ✅ Accent color : `#FFAB00`
3. ✅ Police : Montserrat ou Roboto
4. ✅ Emails avec branding Brutify

### Dans le code (déjà fait) :
1. ✅ Message de confirmation instantané
2. ✅ Adresse de facturation auto
3. ✅ Téléphone désactivé

---

**Tu veux que j'ajoute d'autres options de personnalisation dans le code ?** (codes promo, champs custom, message after_submit, etc.)
