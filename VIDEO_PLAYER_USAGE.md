# VideoPlayer Custom — Guide d'utilisation

## Utilisation basique

```tsx
import { VideoPlayer } from "@/components/ui/VideoPlayer";

export default function MaPage() {
  return (
    <VideoPlayer 
      src="/videos/ma-video.mp4"
      poster="/thumbnails/thumbnail.jpg"
    />
  );
}
```

## Props disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **requis** | URL de la vidéo (locale, Supabase, ou CDN) |
| `poster` | `string` | - | Image de couverture avant lecture |
| `className` | `string` | - | Classes CSS additionnelles |
| `autoPlay` | `boolean` | `false` | Lecture automatique |
| `muted` | `boolean` | `false` | Démarrage en mode muet |
| `loop` | `boolean` | `false` | Lecture en boucle |
| `vslMode` | `boolean` | `false` | **Mode VSL** : Barre de progression accélérée (rétention +40%) |
| `onEnded` | `() => void` | - | Callback quand la vidéo se termine |
| `onTimeUpdate` | `(current: number, duration: number) => void` | - | Callback sur chaque update de temps |

## Exemples d'utilisation

### 1. Simple player

```tsx
<VideoPlayer src="/videos/demo.mp4" />
```

### 2. Avec poster et autoplay

```tsx
<VideoPlayer 
  src="/videos/promo.mp4"
  poster="/thumbnails/promo-thumb.jpg"
  autoPlay
  muted
/>
```

### 3. Mode VSL (Rétention maximale) 🔥

```tsx
<VideoPlayer 
  src="/videos/vsl-sales.mp4"
  vslMode={true}
/>
```

**Qu'est-ce que le mode VSL ?**

Le mode VSL (Video Sales Letter) utilise une **courbe de progression par segments** pour maximiser la rétention :

### Effet visuel optimisé :
- **0-15% réel** → **0-50% affiché** : La barre avance rapidement (ratio 3.3x)
  - Sur une vidéo de 3 min, après 27 secondes → barre à 50%
- **15-40% réel** → **50-80% affiché** : Avance normalement (ratio 1.2x)
  - De 27s à 72s → barre de 50% à 80%
- **40-100% réel** → **80-100% affiché** : Ralentit considérablement (ratio 0.33x)
  - De 72s à 180s → barre de 80% à 100% (presque 2 minutes pour 20% de barre)

### Psychologie :
L'utilisateur voit la barre monter vite au début, pense "c'est bientôt fini", et reste jusqu'au bout même si 60% du contenu reste à voir.

**Résultat mesuré** : +44% de rétention (source : VSL Player).

**Quand l'utiliser ?**
- ✅ VSL de vente (landing pages, produits)
- ✅ Démos produit
- ✅ Vidéos de capture d'email
- ❌ Pas pour du contenu éducatif/tutoriel (où la progression réelle compte)

### 4. Avec callbacks

```tsx
const [progress, setProgress] = useState(0);

<VideoPlayer 
  src="/videos/tutorial.mp4"
  onTimeUpdate={(current, total) => {
    setProgress((current / total) * 100);
  }}
  onEnded={() => {
    console.log("Vidéo terminée!");
    // Déclencher une action, afficher un CTA, etc.
  }}
/>
```

### 5. Dans un modal

```tsx
<motion.div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80">
  <div className="w-full max-w-4xl">
    <VideoPlayer 
      src={videoUrl}
      className="aspect-video"
    />
  </div>
</motion.div>
```

## Fonctionnalités incluses

✅ **Contrôles personnalisés** — Play/Pause, Timeline interactive, Volume, Fullscreen

✅ **Design Brutify** — Couleurs or/dark, glows, animations fluides

✅ **Auto-hide controls** — Les contrôles disparaissent après 3s de lecture

✅ **Raccourcis clavier** :
- `Espace` : Play/Pause
- `M` : Mute/Unmute
- `F` : Fullscreen

✅ **Responsive** — S'adapte à tous les écrans

✅ **Loading state** — Spinner doré pendant le chargement

✅ **Mode VSL** — Barre de progression psychologique sans affichage du temps (optimal pour conversion)

## Formats vidéo supportés

Le lecteur HTML5 supporte nativement :
- **MP4** (H.264) — recommandé ✅
- **WebM** (VP8/VP9)
- **OGG** (Theora)

Pour une compatibilité maximale, utilisez **MP4 avec codec H.264**.

## Héberger vos vidéos

### Option 1 : Dossier public Next.js

Placez vos vidéos dans `/public/videos/` :

```tsx
<VideoPlayer src="/videos/ma-video.mp4" />
```

⚠️ **Limite** : Fichiers limités à ~50MB pour le déploiement Vercel

### Option 2 : Supabase Storage (recommandé)

1. Créer un bucket `videos` dans Supabase
2. Upload votre vidéo
3. Récupérer l'URL publique

```tsx
const videoUrl = supabase.storage.from('videos').getPublicUrl('demo.mp4').data.publicUrl;

<VideoPlayer src={videoUrl} />
```

### Option 3 : CDN externe

Uploadez sur un CDN (Cloudflare R2, AWS S3, etc.) et utilisez l'URL :

```tsx
<VideoPlayer src="https://cdn.example.com/video.mp4" />
```

## Personnalisation avancée

Le composant est entièrement modifiable. Ouvrez `src/components/ui/VideoPlayer.tsx` pour :

- Changer les couleurs, tailles, animations
- Ajouter des boutons (vitesse, qualité, PiP, etc.)
- Modifier le comportement de la timeline
- Ajouter des overlays, watermarks
- Intégrer des chapitres, sous-titres
- Tracker des analytics

## Exemple : Remplacer le lecteur YouTube dans VideoDetailModal

```tsx
// Dans VideoDetailModal.tsx, remplacer le bouton "Voir la vidéo" par :

import { VideoPlayer } from "@/components/ui/VideoPlayer";

// Si vous avez l'URL vidéo directe :
<VideoPlayer 
  src={video.directVideoUrl}
  poster={video.thumbnailUrl}
  className="w-full aspect-video"
/>
```

---

## Support & Personnalisation

Le lecteur est 100% modifiable. Tous les contrôles, styles et comportements peuvent être ajustés directement dans le fichier source.
