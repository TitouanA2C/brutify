# 🔄 Système d'emprunt BP - Documentation

## Vue d'ensemble

Le système d'emprunt BP permet aux utilisateurs avec un **abonnement actif** d'emprunter des BrutPoints sur leur quota du mois prochain quand leurs BP actuels sont épuisés.

## Règles du système

### Éligibilité
- ✅ Abonnement actif requis (`stripe_subscription_id` présent)
- ✅ Plans éligibles : Creator, Growth, Scale
- ❌ Pas d'emprunt si annulation prévue

### Limites d'emprunt
- **Maximum empruntable** : 20% du quota mensuel
  - Creator (500 BP/mois) : max 100 BP
  - Growth (2000 BP/mois) : max 400 BP
  - Scale (6000 BP/mois) : max 1200 BP

### Remboursement
- **Automatique** au renouvellement mensuel
- Formule : `nouveaux_bp = quota_plan - bp_empruntés`
- Minimum garanti : 100 BP après remboursement

## Architecture technique

### 1. Base de données

```sql
-- Nouvelle colonne dans profiles
borrowed_credits INTEGER DEFAULT 0

-- Contrainte de sécurité
CHECK (borrowed_credits >= 0)
```

### 2. API `/api/credits/borrow`

#### POST - Emprunter des BP
```typescript
{
  amount: 50  // Nombre de BP à emprunter
}

// Réponse
{
  success: true,
  borrowed: 50,
  newCredits: 50,
  totalBorrowed: 50,
  maxBorrowable: 400,
  remainingBorrowable: 350
}
```

#### GET - Consulter l'état d'emprunt
```typescript
// Réponse
{
  hasActiveSubscription: true,
  currentCredits: 0,
  currentBorrowed: 50,
  maxBorrowable: 400,
  availableToBorrow: 350,
  borrowPercentage: 20
}
```

### 3. Webhook Stripe

La fonction `handleMonthlyReset` a été modifiée pour :

1. Récupérer `borrowed_credits` du profil
2. Calculer `newCredits = quota_plan - borrowed_credits`
3. Reset `borrowed_credits` à 0
4. Logger la transaction de remboursement

```typescript
// Exemple de renouvellement
Plan Growth (2000 BP)
BP empruntés : 150
→ Nouveaux BP = 2000 - 150 = 1850 BP
→ borrowed_credits = 0
```

### 4. UI/UX

#### CreditsAlert
- Affiche l'option d'emprunt **en priorité** quand BP = 0
- Boutons rapides : 50 BP, 100 BP, 200 BP
- Option "Acheter un pack" en secondaire

#### Sidebar
- Badge "(X empruntés)" affiché à côté des BP
- Visible uniquement si `borrowed_credits > 0`

## Flux utilisateur

### Scénario 1 : Emprunt réussi

```
1. User à 0 BP clique "Transcrire une vidéo"
2. Alerte s'affiche : "Plus de BP !"
3. User voit : "Emprunter 50 / 100 / 200 BP"
4. Click sur "50 BP"
5. → API POST /api/credits/borrow {amount: 50}
6. → credits: 0 → 50, borrowed_credits: 0 → 50
7. → Page refresh
8. User peut utiliser ses 50 BP
9. Sidebar affiche "50 BP (50 empruntés)"
```

### Scénario 2 : Remboursement mensuel

```
1. 1er avril : renouvellement Growth
2. Webhook Stripe : invoice.paid
3. handleMonthlyReset() :
   - Lit borrowed_credits = 50
   - Calcule 2000 - 50 = 1950 BP
   - Set credits = 1950
   - Set borrowed_credits = 0
4. Email : "Renouvellement : 2000 BP (50 remboursés) = 1950 BP"
```

### Scénario 3 : Limite atteinte

```
User Growth déjà emprunté 400 BP (max)
→ Boutons d'emprunt désactivés
→ Message : "Limite d'emprunt atteinte (400/400 BP)"
→ Seule option : "Acheter un pack"
```

## Sécurité et garde-fous

### Protection contre les abus

1. **Vérification abonnement actif**
   ```typescript
   if (!profile.stripe_subscription_id) {
     return 403 // Forbidden
   }
   ```

2. **Cap strict**
   ```typescript
   const maxBorrowable = Math.floor(planCredits * 0.2)
   if (currentBorrowed + amount > maxBorrowable) {
     return 403
   }
   ```

3. **Minimum après remboursement**
   ```typescript
   const newCredits = Math.max(100, planCredits - borrowed)
   ```

### Logs et monitoring

Toutes les actions sont loggées dans `credit_transactions` :

```typescript
// Emprunt
{
  user_id,
  amount: 50,
  action: "borrow",
  reference_id: "borrow_1234567890"
}

// Remboursement
{
  user_id,
  amount: -50,
  action: "borrow_repayment",
  reference_id: "sub_xxxxx"
}
```

## Avantages business

### Réduction du churn
- Dette psychologique → user reste abonné
- Friction minimale → pas d'abandon

### Métriques attendues
- **Churn** : -15% (estimation)
- **LTV** : +20%
- **Coût** : Négligeable (~0.30€ max par user churné)

### Différenciation
- Feature innovante, rare dans les SaaS
- UX premium sans coût Stripe

## Migration et déploiement

### Étapes

1. **Exécuter la migration SQL**
   ```bash
   psql $DATABASE_URL < supabase/add_borrowed_credits.sql
   ```

2. **Déployer le code**
   - Types TypeScript mis à jour
   - API /api/credits/borrow créée
   - Webhook Stripe modifié
   - UI CreditsAlert + Sidebar modifiés

3. **Tester**
   - Emprunter 50 BP
   - Vérifier sidebar "(50 empruntés)"
   - Simuler renouvellement (webhook test)
   - Vérifier reset borrowed_credits

### Rollback

Si problème, revert en 2 étapes :

1. Code : `git revert <commit>`
2. DB : `ALTER TABLE profiles DROP COLUMN borrowed_credits;`

## FAQ

**Q: Que se passe-t-il si user annule avant remboursement ?**  
R: Perte max = borrowed_credits × coût_API (~0.30€). Acceptable comme coût d'acquisition.

**Q: Peut-on emprunter sur plusieurs mois ?**  
R: Non. Reset à 0 chaque mois. Pas de "spirale d'endettement".

**Q: Comment empêcher les multi-comptes ?**  
R: Stripe bloque les cartes bancaires dupliquées. 1 carte = 1 compte.

**Q: User peut-il acheter des packs ET emprunter ?**  
R: Oui ! Options complémentaires, pas exclusives.

## Support

En cas de problème :
1. Check logs : `[Borrow]` dans les logs serveur
2. Check DB : `SELECT borrowed_credits FROM profiles WHERE id = 'xxx'`
3. Check transactions : `SELECT * FROM credit_transactions WHERE action LIKE '%borrow%'`

---

**Implémenté le** : 2026-03-06  
**Version** : 1.0.0
