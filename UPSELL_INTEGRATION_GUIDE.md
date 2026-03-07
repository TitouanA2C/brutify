# 🎯 Guide d'intégration des Upsells intelligents

## Vue d'ensemble

Le système d'upselling de Brutify déclenche automatiquement des offres one-time irrésistibles basées sur les **quick wins** et les **moments clés** de l'utilisateur.

---

## 🚀 Comment déclencher un upsell

### 1. Importer le hook

```typescript
import { useUpsell } from "@/components/upsell/UpsellProvider"
```

### 2. Déclencher au bon moment

```typescript
const { triggerUpsell } = useUpsell()

// Exemple : Premier script généré avec succès
const handleScriptGenerated = async () => {
  const result = await generateScript(...)
  
  if (result.success) {
    // Déclencher l'upsell après le quick win !
    triggerUpsell("first_script_success")
  }
}
```

---

## 📋 Liste complète des triggers disponibles

| Trigger | Description | Plan éligible | Cible | Offre |
|---------|-------------|---------------|-------|-------|
| `first_script_success` | Premier script généré | Free | Creator | 7j gratuits |
| `script_streak` | 3 scripts en 24h | Creator | Growth | -20% 1er mois |
| `first_analysis` | Essai d'analyse IA | Free/Creator | Growth | -20% 1er mois |
| `transcription_limit` | Essai de transcription | Creator | Growth | -20% 1er mois |
| `radar_limit` | Watchlist pleine (10) | Creator | Growth | -20% 1er mois |
| `credits_50_percent` | 50% BP consommés en 7j | Creator/Growth | Growth/Scale | -20% |
| `multi_feature_use` | 3+ features en 1 session | Free/Creator | Growth | -20% 1er mois |
| `creator_list_full` | Watchlist saturée | Creator | Growth | -20% 1er mois |
| `power_user_detected` | 20+ actions en 1 journée | Growth | Scale | +1000 BP bonus |

---

## 🎨 Exemples d'intégration par page

### **Page Script** (`/board`)

```typescript
"use client"

import { useUpsell } from "@/components/upsell/UpsellProvider"
import { useUser } from "@/hooks/useUser"

export default function BoardPage() {
  const { triggerUpsell } = useUpsell()
  const { profile } = useUser()
  
  const handleScriptGenerated = async () => {
    const result = await forgeScript(...)
    
    if (result.success) {
      // Track nombre de scripts générés dans la session
      const scriptsCount = getScriptsCountToday()
      
      // Premier script ? → Upsell Creator trial
      if (scriptsCount === 1 && profile?.plan === "free") {
        triggerUpsell("first_script_success")
      }
      
      // 3 scripts en 24h ? → Upsell Growth
      if (scriptsCount === 3 && profile?.plan === "creator") {
        triggerUpsell("script_streak")
      }
    }
  }
  
  return (
    <div>
      <button onClick={handleScriptGenerated}>
        Forger un script
      </button>
    </div>
  )
}
```

### **Page Créateurs** (`/creators`)

```typescript
"use client"

import { useUpsell } from "@/components/upsell/UpsellProvider"
import { useUser } from "@/hooks/useUser"

export default function CreatorsPage() {
  const { triggerUpsell } = useUpsell()
  const { profile } = useUser()
  
  const handleAddCreator = async (creatorId: string) => {
    const watchlistCount = await getWatchlistCount()
    
    // Watchlist pleine (10 pour Creator) ?
    if (watchlistCount >= 10 && profile?.plan === "creator") {
      triggerUpsell("radar_limit")
      return // Bloquer l'ajout
    }
    
    await addToWatchlist(creatorId)
  }
  
  return (
    <div>
      <button onClick={handleAddCreator}>
        Ajouter au radar
      </button>
    </div>
  )
}
```

### **Page Vidéos** (tentative d'analyse)

```typescript
"use client"

import { useUpsell } from "@/components/upsell/UpsellProvider"
import { useUser } from "@/hooks/useUser"

export default function VideosPage() {
  const { triggerUpsell } = useUpsell()
  const { profile } = useUser()
  
  const handleAnalyzeVideo = async (videoId: string) => {
    // Feature Growth+ uniquement
    if (profile?.plan === "free" || profile?.plan === "creator") {
      triggerUpsell("first_analysis")
      return // Bloquer l'action
    }
    
    await analyzeVideo(videoId)
  }
  
  return (
    <div>
      <button onClick={handleAnalyzeVideo}>
        Analyser cette vidéo
      </button>
    </div>
  )
}
```

### **Tracking global** (dans un `useEffect`)

```typescript
"use client"

import { useEffect } from "react"
import { useUpsell } from "@/components/upsell/UpsellProvider"
import { useUser } from "@/hooks/useUser"
import { useCredits } from "@/lib/credits-context"

export default function AppLayout({ children }) {
  const { triggerUpsell } = useUpsell()
  const { profile } = useUser()
  const { credits } = useCredits()
  
  useEffect(() => {
    if (!profile) return
    
    const plan = profile.plan ?? "free"
    const maxCredits = getMaxCredits(plan)
    const percentage = (credits / maxCredits) * 100
    
    // 50% des BP consommés en moins de 7 jours ?
    if (percentage <= 50 && isWithin7Days(profile.monthly_credits_reset_at)) {
      triggerUpsell("credits_50_percent")
    }
  }, [credits, profile, triggerUpsell])
  
  return <div>{children}</div>
}
```

---

## ⚙️ Configuration avancée

### Cooldown entre triggers

Chaque trigger a un **cooldown** pour éviter le spam :

```typescript
{
  first_script_success: 24h,
  script_streak: 7 jours,
  radar_limit: 5 jours,
  power_user_detected: 14 jours,
}
```

Le système vérifie automatiquement via `localStorage` et ne montre pas deux fois le même trigger avant le cooldown.

### Priorité des triggers

Si plusieurs triggers sont éligibles en même temps, le système affiche celui avec la **plus haute priorité** :

```typescript
priority: 1-10 (10 = max urgence)

Exemples :
- first_script_success: 9 (quick win majeur)
- power_user_detected: 9 (power user rare)
- script_streak: 8 (momentum)
- radar_limit: 7 (limite fonctionnelle)
```

### Tracking des conversions

Quand l'user clique sur le CTA, `acceptUpsell()` est appelé automatiquement. Tu peux ajouter le tracking analytics là :

```typescript
// Dans src/hooks/useUpsellTrigger.ts
const acceptUpsell = useCallback(() => {
  if (currentTrigger) {
    console.log(`[Upsell] User accepted: ${currentTrigger.type}`)
    
    // TODO: Ajouter tracking
    // analytics.track("upsell_accepted", {
    //   trigger: currentTrigger.type,
    //   from_plan: profile?.plan,
    //   to_plan: currentTrigger.targetPlan,
    // })
  }
  setCurrentTrigger(null)
}, [currentTrigger])
```

---

## 🎁 Offres disponibles

### 1. **Free → Creator Trial** (7j gratuits)
- Badge : "OFFRE SPÉCIALE" (gold)
- Headline : "7 jours gratuits sur Creator"
- Features : 500 BP/mois, scripts illimités, etc.
- CTA : "Démarrer l'essai gratuit"
- Sans CB · Annulation auto

### 2. **Creator → Growth** (-20% 1er mois)
- Badge : "ONE-TIME OFFER" (purple/pink)
- Headline : "-20% sur ton 1er mois Growth"
- Prix : ~~39€~~ → **31€**
- Features : 2000 BP, transcription, analyse, radar illimité
- CTA : "Upgrader maintenant"

### 3. **Growth → Scale** (+1000 BP bonus)
- Badge : "POWER USER" (green)
- Headline : "+1000 BP OFFERTS · Scale"
- Features : 7000 BP le 1er mois (6000 + 1000 bonus)
- CTA : "Passer à Scale"

### 4. **Mensuel → Annuel** (3 mois offerts)
- Badge : "MEILLEURE OFFRE" (gold/orange)
- Headline : "3 MOIS OFFERTS en annuel"
- Économie : Jusqu'à 264€/an
- CTA : "Passer en annuel"

---

## 🔥 Best Practices

### ✅ DO

- Déclencher après un **quick win** (script généré, analyse réussie)
- Déclencher quand l'user **découvre une limite** (watchlist pleine, feature locked)
- Laisser l'user **terminer son action** avant d'afficher le modal
- Offrir une **valeur claire** (réduction, bonus, trial)

### ❌ DON'T

- Déclencher pendant une action (génération en cours)
- Spammer (respecter les cooldowns)
- Proposer un saut trop grand (Free → Scale)
- Afficher sans contexte (random moment)

---

## 📊 A/B Testing (futur)

Pour tester différentes offres, modifier `OFFER_CONFIGS` dans `UpsellModal.tsx` :

```typescript
creator_to_growth_20: {
  discount: "-20%",  // Version A
  // discount: "-25%",  // Version B (à tester)
}
```

Puis tracker les conversions pour voir quelle version performe le mieux.

---

🎯 **Résultat attendu** : +40-60% de conversion sur les upgrades grâce aux offres contextuelles et irrésistibles !
