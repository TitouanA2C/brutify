# 🎨 Brutify Design System

Documentation complète du système de design Brutify basé sur la landing page premium.

## 📐 Patterns de la Landing Page

### 🌟 Couleurs & Effets

#### Gold Accent (Signature)
```css
Primary Gold: #FFAB00
Gold Light: #FFD700  
Gold Dark: #CC8800

/* Gradients */
text-gold-gradient: linear-gradient(180deg, #FFD700 0%, #FFAB00 50%, #CC8800 100%)
bg-gold-gradient: linear-gradient(135deg, #FFD700 0%, #FFAB00 50%, #CC8800 100%)
```

#### Backgrounds & Cards
```css
/* Dark backgrounds with depth */
bg-[#0A0A0E]        /* Sidebar, darkest */
bg-[#111113]        /* Cards, elevated */
bg-brutify-bg       /* Main: #09090B */

/* Glass effects */
bg-[#111113]/60 backdrop-blur-sm    /* Premium cards */
border-white/[0.06]                  /* Subtle borders */
```

#### Glows & Shadows
```css
/* Gold glows (very important for premium feel) */
shadow-[0_0_20px_rgba(255,171,0,0.06)]      /* Subtle */
shadow-[0_0_40px_rgba(255,171,0,0.15)]      /* Medium */
box-shadow: 0 0 0 4px rgba(255,171,0,0.15)   /* Ring effect */

/* Depth shadows */
shadow-[0_8px_24px_rgba(0,0,0,0.4)]         /* Card depth */
shadow-[0_12px_40px_rgba(0,0,0,0.5)]        /* Dropdown */
```

### 🎭 Animations & Transitions

#### Easing
```typescript
const EASE_EXPO = [0.16, 1, 0.3, 1] as const;  // Primary easing
```

#### Hover Effects
```tsx
// Card hover
whileHover={{ scale: 1.025, y: -4 }}
transition={{ duration: 0.25, ease: "easeOut" }}
hover:border-white/[0.1]
hover:shadow-[0_0_20px_rgba(255,171,0,0.06)]

// Button hover
group-hover:translate-x-1       /* Arrow shift */
group-hover:opacity-80          /* Ambient glow */
```

#### Entry Animations
```tsx
// Staggered cards
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1 + i * 0.08, duration: 0.25, ease: EASE_EXPO }}

// Fade in up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
```

### 📦 Components Patterns

#### Premium Card
```tsx
<div className="rounded-2xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/[0.1] hover:shadow-[0_0_20px_rgba(255,171,0,0.06)]">
  {/* Gold glow on hover */}
  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.12]" 
       style={{ background: '#FFAB00' }} />
  {/* Content */}
</div>
```

#### Gold CTA Button
```tsx
<Link href="#" className="group relative inline-flex">
  {/* Ambient glow */}
  <div className="absolute -inset-3 rounded-2xl bg-brutify-gold/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
  {/* Border ring */}
  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-brutify-gold-light via-brutify-gold to-brutify-gold-dark opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
  {/* Border Beam (Magic UI) */}
  <BorderBeam size={300} duration={12} colorFrom="#FFD700" colorTo="#FFAB00" />
  {/* Button content */}
  <div className="relative flex items-center gap-3 rounded-[10px] bg-gradient-to-b from-[#1a1400] via-[#130f00] to-[#0d0a00] px-8 py-3.5">
    <span className="text-[15px] font-body font-semibold text-brutify-gold-light group-hover:text-white transition-colors duration-200">
      Essai gratuit
    </span>
    <ArrowRight className="h-3.5 w-3.5 text-brutify-gold transition-transform duration-200 group-hover:translate-x-0.5" />
  </div>
</Link>
```

#### Icon Container
```tsx
{/* Gold accent icon container */}
<div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brutify-border-gold bg-brutify-gold/[0.08] shadow-[0_0_10px_rgba(255,171,0,0.08)]">
  <Icon className="h-6 w-6 text-brutify-gold" />
</div>

{/* With animation on hover */}
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brutify-gold/[0.12] transition-colors group-hover:shadow-[0_0_10px_rgba(255,171,0,0.08)]">
  <Icon className="h-4 w-4 text-brutify-gold" />
</div>
```

### 📊 Spacing & Layout

```css
/* Page container */
max-w-[1400px] mx-auto

/* Section spacing */
mb-10  /* Between sections */
gap-5  /* Card grids */
p-6    /* Card padding */

/* Typography */
font-display text-6xl tracking-wider  /* Titles */
font-body text-sm text-brutify-text-secondary  /* Body */
```

### 🔤 Typography Hierarchy

```tsx
// Page Title
<h1 className="font-display text-6xl md:text-7xl tracking-wider text-gold-gradient">
  BRUTIFY
</h1>

// Section Title
<h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary">
  Titre
</h2>

// Card Title
<h3 className="font-display text-2xl tracking-wider text-brutify-text-primary">
  Carte
</h3>

// Body Text
<p className="font-body text-sm text-brutify-text-secondary leading-relaxed">
  Texte
</p>

// Small Label
<span className="text-[10px] font-body font-semibold uppercase tracking-[0.2em] text-brutify-text-muted/50">
  MENU
</span>
```

## ✨ Magic UI Components Utilisés

1. **DotPattern** - Background subtil avec dots dorés
2. **NumberTicker** - Animation des nombres
3. **BorderBeam** - Animation de border sur les CTA
4. **AnimatedShinyText** - Texte avec shimmer (disponible mais pas encore utilisé)

## 🎯 À Appliquer au SaaS

### Priority 1: Cards
- Ajouter `backdrop-blur-sm` à toutes les cards
- Uniformiser `border-white/[0.06]`
- Ajouter hover effects avec gold glow
- Background `bg-[#111113]/60` au lieu de opaque

### Priority 2: Buttons  
- Créer variant "gold" premium avec BorderBeam
- Ajouter ambient glow sur hover
- Icon animations (translate, rotate)

### Priority 3: Layout
- Ajouter DotPattern en background des pages principales
- Implémenter staggered animations pour les listes
- Améliorer loading states

### Priority 4: Micro-interactions
- Hover effects sur tous les clickables
- Scale + Y transform sur cards
- Icon rotate/translate animations
- Pulsing effects pour notifications/badges
