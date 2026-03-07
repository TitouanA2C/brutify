# 🎁 Système complet de fidélisation BP

## Vue d'ensemble

Système à 4 piliers pour maximiser la rétention et réduire la friction :

1. **Rollover BP** : Les BP inutilisés se reportent (max 50%)
2. **Emprunt BP** : Emprunter sur le mois prochain (max 20%)
3. **Transcriptions gratuites** : 3/5/10 par mois selon plan
4. **Bonus d'activation** : Gamification de l'onboarding (max 550 BP)

## 🔄 1. Rollover BP

### Principe
Les BP non utilisés se reportent au mois suivant, avec un cap à 50% du quota.

### Exemple
```
Mars 2026 (Growth) :
- Quota : 2000 BP
- Utilisés : 1200 BP
- Restants : 800 BP

Avril 2026 :
- Quota : 2000 BP
- Rollover : 800 BP (< 50% = OK)
- Total : 2800 BP disponibles
```

### Avec cap dépassé
```
Mars 2026 (Growth) :
- Quota : 2000 BP
- Utilisés : 300 BP
- Restants : 1700 BP

Avril 2026 :
- Quota : 2000 BP
- Rollover : 1000 BP (cap à 50%)
- 700 BP perdus (au-dessus du cap)
- Total : 3000 BP disponibles
```

### Implémentation
Géré automatiquement dans le webhook Stripe (`handleMonthlyReset`).

## 🔄 2. Emprunt BP

### Principe
Emprunter jusqu'à 20% du quota mensuel sur le mois prochain.

### Limites
- Creator (500 BP) : max 100 BP
- Growth (2000 BP) : max 400 BP
- Scale (6000 BP) : max 1200 BP

### Remboursement
```
Avril avec emprunt :
- Quota : 2000 BP
- Emprunt de Mars : -150 BP
- Final : 1850 BP (min garanti : 100 BP)
```

### API
- `POST /api/credits/borrow` : Emprunter
- `GET /api/credits/borrow` : Consulter l'état

## 🎁 3. Transcriptions gratuites

### Quotas mensuels
- Creator : 3 transcriptions/mois
- Growth : 5 transcriptions/mois
- Scale : 10 transcriptions/mois

### Logique
```typescript
Ordre de priorité pour transcrire :
1. Vérifier transcriptions gratuites disponibles
   → Si oui : utiliser (0 BP)
2. Sinon, vérifier BP disponibles
   → Si oui : consommer 3 BP
3. Sinon, proposer emprunt
   → Si accepté : emprunter + consommer
4. Sinon, bloquer + proposer achat
```

### Reset
Automatique tous les 30 jours (ou au renouvellement).

## 🎯 4. Bonus d'activation

### Liste des bonus

| ID | Nom | Condition | Récompense |
|----|-----|-----------|------------|
| `follow_creators` | Premier radar | Suivre 3 créateurs | +50 BP |
| `scrape_videos` | Détection lancée | Scraper 5 vidéos | +50 BP |
| `generate_script` | Premier script | Générer 1 script | +100 BP |
| `add_to_board` | Organisation pro | Ajouter au board | +50 BP |
| `early_upgrade` | Upgrade anticipé | Upgrade dans les 7j | +300 BP |

**Total possible** : 550 BP de bonus

### Bonus upgrade anticipé (spécial)

Condition : Upgrade vers un plan payant **pendant les 7 premiers jours**.

**Déclencheur** : Automatique dans le webhook Stripe lors de `checkout.session.completed`.

```typescript
if (accountAge <= 7 days && is_first_subscription) {
  credits += 300
  activation_bonuses.early_upgrade = true
}
```

### UI

**Tracker visible pendant l'essai** (Dashboard) :
- Affiche progression (ex: 2/5 bonus)
- Liste des bonus avec état (débloqué/locked)
- Modal de célébration quand bonus débloqué

**Conditions de déblocage** :
- Automatique quand condition remplie
- API check en background
- Notification + confetti

## 📊 Compatibilité entre systèmes

### Rollover + Emprunt

```
Exemple complet (Growth) :

Mars :
- Quota : 2000 BP
- Utilisés : 1400 BP
- Restants : 600 BP
- Emprunt : 150 BP

Avril (renouvellement) :
1. Rollover : 600 BP (< 50% = OK)
2. Nouveau quota : 2000 BP
3. Remboursement : -150 BP
4. Total : 2000 + 600 - 150 = 2450 BP

État final :
- credits : 2450
- rollover_credits : 600
- borrowed_credits : 0 (reset)
```

### Transcriptions gratuites + Emprunt

```
Scénario :
- User à 0 BP
- 2/5 transcriptions gratuites utilisées
→ User voit d'abord : "3 transcriptions gratuites restantes"
→ Si toutes utilisées : "Emprunter 50/100/200 BP"
→ En dernier recours : "Acheter un pack"
```

## 🗄️ Schéma DB

```sql
ALTER TABLE profiles ADD COLUMN:
- borrowed_credits INTEGER DEFAULT 0
- rollover_credits INTEGER DEFAULT 0
- free_transcripts_used INTEGER DEFAULT 0
- free_transcripts_reset_at TIMESTAMPTZ DEFAULT NOW()
- activation_bonuses JSONB DEFAULT '{...}'
```

## 🔐 Sécurité

### Emprunt
- Vérification abonnement actif
- Cap strict à 20%
- Pas d'emprunt si annulation prévue

### Rollover
- Cap à 50% du quota
- Pas d'accumulation infinie

### Transcriptions gratuites
- Reset mensuel automatique
- Compteur par user

### Bonus d'activation
- Conditions vérifiées côté serveur
- Impossibilité de débloquer 2 fois
- Période d'éligibilité limitée (essai)

## 📈 Impact attendu

| Métrique | Avant | Après | Évolution |
|----------|-------|-------|-----------|
| Churn mensuel | 8% | 4% | **-50%** |
| Conversion essai | 25% | 38% | **+52%** |
| LTV moyenne | 180€ | 310€ | **+72%** |
| NPS | 42 | 65 | **+55%** |

## 🎨 UX complète

### À 0 BP avec abonnement actif

```
┌─────────────────────────────────────────────┐
│ 🚨 Plus de BrutPoints !                     │
│                                             │
│ Tes BP sont épuisés. Choisis une option :  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ✨ Transcriptions gratuites             │ │
│ │ 3 transcriptions restantes ce mois      │ │
│ │ 💡 Pas de BP nécessaires                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔄 Emprunter sur le mois prochain       │ │
│ │ Jusqu'à 400 BP disponibles              │ │
│ │ [50 BP] [100 BP] [200 BP]               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Ou acheter un pack]                        │
└─────────────────────────────────────────────┘
```

### Sidebar (badge BP)

```
┌──────────────────┐
│ 2450 BP          │
│ (+600 reportés)  │
│ (-150 empruntés) │
└──────────────────┘
```

### Dashboard (tracker bonus)

```
┌─────────────────────────────────┐
│ 🎁 Bonus d'activation   2/5     │
│                                 │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 40%        │
│                                 │
│ ✓ Premier radar         +50 BP  │
│ ✓ Détection lancée      +50 BP  │
│ □ Premier script       +100 BP  │
│ □ Organisation pro      +50 BP  │
│ □ Upgrade anticipé     +300 BP  │
│                                 │
│ Total gagné : 100 BP            │
└─────────────────────────────────┘
```

## 🚀 Déploiement

### 1. Migration DB
```bash
psql $DATABASE_URL < supabase/add_borrowed_credits.sql
```

### 2. Vérification
```sql
-- Vérifier les colonnes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('borrowed_credits', 'rollover_credits', 'free_transcripts_used', 'activation_bonuses');
```

### 3. Test complet

#### Test emprunt
1. Mettre BP à 0
2. Cliquer "Emprunter 50 BP"
3. Vérifier credits = 50, borrowed_credits = 50

#### Test transcriptions gratuites
1. Transcrire une vidéo
2. Vérifier response : `used_free_transcript: true`
3. Vérifier DB : `free_transcripts_used = 1`

#### Test rollover
1. Attendre renouvellement (ou simuler webhook)
2. Vérifier rollover_credits calculé
3. Vérifier BP finaux = quota + rollover - emprunt

#### Test bonus activation
1. Dashboard affiche tracker
2. Suivre 3 créateurs
3. Vérifier modal "Bonus débloqué ! +50 BP"

#### Test early upgrade bonus
1. Créer nouveau compte
2. Upgrade dans les 3 premiers jours
3. Vérifier credits = 500 + 300 = 800 BP

## 📊 Analytics à monitorer

Ajouter des events tracking :
```typescript
// Emprunt BP
analytics.track("credits_borrowed", { amount, plan })

// Transcription gratuite utilisée
analytics.track("free_transcript_used", { remaining, plan })

// Bonus débloqué
analytics.track("activation_bonus_unlocked", { bonusId, reward })

// Early upgrade
analytics.track("early_upgrade_bonus", { accountAge, plan })
```

## 💡 Optimisations futures

### Phase 2
1. Email notification quand BP rollover
2. Push notification quand bonus débloqué
3. Dashboard : graphique historique BP
4. Prédiction épuisement BP (IA)

### Phase 3
1. Partage de BP entre team members (Scale)
2. BP gifts (parrainage)
3. Bonus streak (X jours consécutifs)
4. Bonus saisonniers

---

**Implémenté le** : 2026-03-06  
**Version** : 1.0.0  
**Systèmes** : Rollover ✓ | Emprunt ✓ | Gratuit ✓ | Bonus ✓
