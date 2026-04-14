# Brutify MVP — Testing Checklist

> Checklist complete pour valider que toutes les features sont fonctionnelles avant le deploy.
> Tester sur `http://localhost:3000` avec `npm run dev`.

---

## 0. PRE-REQUIS

- [ ] `npm run dev` demarre sans erreur
- [ ] `npx next build` compile sans erreur
- [ ] Variables d'env configurees (.env.local) : SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OPENROUTER_API_KEY, APIFY_API_TOKEN
- [ ] Migration DB executee : `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_submitted BOOLEAN DEFAULT FALSE;`

---

## 1. AUTHENTIFICATION

### 1.1 Inscription
- [ ] Acceder a `/signup`
- [ ] Creer un compte avec email + mot de passe
- [ ] Verifier la redirection vers `/onboarding`
- [ ] Verifier qu'un profil existe dans `profiles` (Supabase dashboard)

### 1.2 Connexion
- [ ] Acceder a `/login`
- [ ] Se connecter avec email + mot de passe
- [ ] Verifier la redirection vers `/dashboard`
- [ ] Se deconnecter (bouton dans la sidebar)
- [ ] Verifier la redirection vers `/login`

### 1.3 Google OAuth
- [ ] Cliquer "Continuer avec Google" sur `/login`
- [ ] Verifier que le callback redirige vers `/dashboard` (ou `/onboarding` si nouveau)
- [ ] Verifier que le profil est cree en base

### 1.4 Protection des routes
- [ ] Essayer d'acceder a `/dashboard` sans etre connecte → redirection `/login`
- [ ] Essayer d'acceder a `/settings` sans etre connecte → redirection `/login`
- [ ] `/login` et `/signup` accessibles sans connexion

---

## 2. ONBOARDING

- [ ] Etape 1 : Selection de niche (Business, Fitness, etc.) → selection fonctionne
- [ ] Etape 2 : Taille d'audience → selection fonctionne
- [ ] Etape 3 : Formats de contenu → multi-selection fonctionne
- [ ] Etape 4 : Frequence de publication → selection fonctionne
- [ ] Etape 5 : Handles reseaux sociaux → champs remplissables
- [ ] Etape 6 : Suggestions de createurs → des createurs s'affichent
- [ ] Etape 7 : Selection de plan → Creator/Growth/Scale affichees correctement
- [ ] Bouton final → redirige vers Stripe Checkout
- [ ] Apres paiement Stripe → retour dans l'app

---

## 3. LANDING PAGE (`/`)

- [ ] Hero : titre "Finis de chercher. Commence a creer." affiche
- [ ] CTA hero : "Commencer gratuitement" redirige vers `/signup`
- [ ] Section AccountAnalysis : champ de recherche de compte + bouton "Analyser"
- [ ] Section Features : 4-5 blocs de features affiches
- [ ] Section How It Works : etapes visibles
- [ ] Section SocialProofBanner : compteur anime + floating cards
- [ ] Section Analytics : stats reseaux
- [ ] Section Pricing : CTA simple "Demarrer l'essai gratuit" (PAS de grille de prix)
- [ ] Section FAQ : onglets Facturation/BP/General fonctionnent, accordion ouvert/ferme
- [ ] Section Not Convinced : boutons ChatGPT et Claude avec prompts longs
- [ ] Footer CTA : "Commencer gratuitement"
- [ ] Navigation : liens Features, Comment ca marche, Essai gratuit, FAQ fonctionnent (scroll smooth)
- [ ] Aucun terme "outlier" visible (remplace par "viral", "top perfs", etc.)

---

## 4. DASHBOARD

- [ ] Section RESEAUX SOCIAUX en haut (focus principal)
  - [ ] Si reseaux connectes : cards avec abonnes, vues moy, engagement, videos
  - [ ] Si pas de reseau : message "Aucun reseau connecte" + lien settings
- [ ] 3 stat cards : Createurs suivis, Top perfs detectees, Scripts forges
- [ ] Section TOP VIRALES : videos qui explosent (pas "outliers")
- [ ] Section CREATEURS EN FEU : createurs en croissance
- [ ] Section BRUTBOARD (full-width) : contenus planifies
- [ ] Quick actions : 3 boutons en bas (Explorer createurs, Analyser videos, Creer script)
- [ ] Activation Bonus Tracker visible pendant l'essai
- [ ] Early Upgrade Banner visible pendant l'essai

---

## 5. CREATEURS (`/creators`)

- [ ] Liste des createurs de la watchlist
- [ ] Filtre par plateforme (Tous, IG, TT, YT)
- [ ] Filtre par niche : **selection MULTIPLE** fonctionne
- [ ] Selectionner 2+ niches en meme temps → filtrage combinatoire
- [ ] Bouton "Reinitialiser" apparait quand filtres actifs
- [ ] Tri par : Brut Score, Followers, Engagement, Ratio viral
- [ ] Bouton "Ajouter un createur" ouvre le modal de recherche
- [ ] Ajouter un createur → apparait dans la liste
- [ ] Sur Creator plan : limite a 10 createurs → upsell "creator_list_full" apparait
- [ ] Cliquer sur un createur → modal detail avec stats

---

## 6. VIDEOS (`/videos`)

- [ ] Feed de videos avec miniatures
- [ ] Filtre par periode (7j, 14j, 30j, 90j)
- [ ] Filtre par "Score viral min" (Tous, 2x+, 5x+, 10x+)
- [ ] Filtre par plateforme
- [ ] Tri par : Score viral, Vues, Likes, Commentaires, Date
- [ ] Pagination fonctionne
- [ ] Cliquer sur une video → VideoDetailModal
  - [ ] Stats de la video (vues, likes, comments)
  - [ ] Bouton "Transcrire" fonctionne (consomme des BP)
  - [ ] Bouton "Analyser" fonctionne (consomme des BP)
  - [ ] Bouton "Forger script" redirige vers `/scripts`
  - [ ] Bouton "Ajouter au BrutBoard" fonctionne
- [ ] Images/miniatures visibles (pas de broken images grace au proxy)

---

## 7. SCRIPTS (`/scripts`)

- [ ] Page de configuration : sujet, type de hook, structure
- [ ] Selection d'une video source (optionnel)
- [ ] Bouton "Forger" → generation en streaming
  - [ ] Section HOOK apparait en premier (gold)
  - [ ] Sections BODY apparaissent (couleurs differentes par sous-section)
  - [ ] Section CTA apparait (orange)
  - [ ] Notes IA dans le sidebar
- [ ] Edition inline : modifier le texte de chaque section
- [ ] **Blocs du BODY : controls au survol**
  - [ ] Bouton monter (fleche haut) fonctionne
  - [ ] Bouton descendre (fleche bas) fonctionne
  - [ ] Bouton dupliquer (icone copie) fonctionne
- [ ] Bouton "Sauver dans BrutBoard" fonctionne
- [ ] Credits consommes correctement

---

## 8. BRUTBOARD (`/board`)

- [ ] Vue liste : contenus par statut (Inspiration, Idee, Brouillon, En cours, Planifie, Publie)
- [ ] Vue calendrier : grille mensuelle avec indicateurs
- [ ] Creer un nouveau contenu (titre, statut, date)
- [ ] Editer un contenu existant
- [ ] Supprimer un contenu
- [ ] Navigation mois precedent/suivant dans le calendrier

---

## 9. SETTINGS (`/settings`)

### 9.1 Profil
- [ ] Nom, email, avatar affiches
- [ ] Tone, style, niche modifiables

### 9.2 Abonnement
- [ ] Plan actuel affiche avec badge
- [ ] Toggle mensuel/annuel
- [ ] Grille de plans avec features
- [ ] Packs de credits BP visibles avec prix
- [ ] Bouton upgrade fonctionne → redirige Stripe

### 9.3 Parametres
- [ ] Handles reseaux modifiables
- [ ] Statut de scraping affiche
- [ ] Bouton deconnexion fonctionne
- [ ] Bouton supprimer le compte visible

---

## 10. SYSTEME DE CREDITS (BP)

- [ ] Credits affiches dans la sidebar
- [ ] Generer un script → credits diminuent (2 BP)
- [ ] Transcrire une video → credits diminuent (3 BP)
- [ ] Analyser une video → credits diminuent (5 BP)
- [ ] Analyse concurrentielle complete → credits diminuent (30 BP)
- [ ] Quand credits insuffisants → message d'erreur + upsell
- [ ] Emprunt de BP :
  - [ ] GET `/api/credits/borrow` retourne la capacite d'emprunt
  - [ ] POST `/api/credits/borrow` avec montant → credits augmentent
  - [ ] Limite respectee (20% du quota mensuel)

---

## 11. GAMIFICATION / BONUSES

- [ ] Bonus "Premier radar" (50 BP) : suivre 3 createurs → claimable sur dashboard
- [ ] Bonus "Detection lancee" (50 BP) : 5 videos scrapees → claimable
- [ ] Bonus "Premier script" (100 BP) : generer 1 script → claimable
- [ ] Bonus "Organisation pro" (50 BP) : ajouter au BrutBoard → claimable
- [ ] Bonus "Ton avis compte" (50 BP) : laisser un avis → claimable (necessite `review_submitted = true` en DB)
- [ ] Bonus "Upgrade anticipe" (300 BP) : upgrade pendant l'essai → claimable

---

## 12. UPSELL SYSTEM

- [ ] `first_script_success` : apres 1er script sur plan Creator → modal upsell
- [ ] `script_streak` : 3 scripts en 24h sur Creator → modal upsell
- [ ] `first_analysis` : premiere analyse IA → modal upsell
- [ ] `transcription_limit` : transcription bloquee (Creator) → modal upsell
- [ ] `creator_list_full` : watchlist pleine (10 createurs) → modal upsell
- [ ] `credits_50_percent` : 50% des BP consommes → modal upsell (auto-check)
- [ ] `power_user_detected` : 20+ actions dans la journee sur Growth → modal upsell
- [ ] `trial_ending_soon` : trial < 24h → modal upsell sur dashboard
- [ ] `trial_power_user` : utilisateur actif en trial → modal upsell
- [ ] Cooldowns respectes (pas de spam de modals)
- [ ] Bouton "Fermer" fonctionne
- [ ] Bouton "Upgrade" redirige vers Stripe

---

## 13. STRIPE / PAIEMENTS

- [ ] Checkout subscription : Creator/Growth/Scale → page Stripe → retour OK
- [ ] Checkout avec code promo (CREATOR15, GROWTH20) → remise appliquee
- [ ] Achat de pack BP → page Stripe → BP credites dans le profil
- [ ] Webhook test : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - [ ] `checkout.session.completed` → profil mis a jour
  - [ ] `invoice.paid` (subscription_cycle) → credits reset mensuel
  - [ ] `customer.subscription.deleted` → plan reset a "creator"
- [ ] Portail client Stripe accessible depuis settings

---

## 14. ANALYSES CONCURRENTIELLES

- [ ] Ouvrir un createur en detail → onglet "Analyse"
- [ ] Lancer une analyse concurrentielle complete (30 BP)
- [ ] Sections affichees :
  - [ ] Key Takeaways (toujours ouvert)
  - [ ] Positionnement (ouvert par defaut)
  - [ ] Hooks (ferme par defaut) → cliquer pour ouvrir
  - [ ] Structures de Script (ferme) → cliquer pour ouvrir
  - [ ] Delivery de Valeur (ferme) → cliquer pour ouvrir
  - [ ] Strategie de Funnel (ferme) → cliquer pour ouvrir
  - [ ] Sujets & Thematiques (ferme) → cliquer pour ouvrir
  - [ ] Metriques & Patterns (ferme) → cliquer pour ouvrir
- [ ] Labels : "Top perfs (>2x)", "Mega virales (>10x)" (pas "outlier")

---

## 15. PROXY IMAGES / VIDEOS

- [ ] Avatars createurs visibles (pas de broken images)
- [ ] Miniatures videos visibles
- [ ] Si image expiree → placeholder transparent (pas d'erreur 404 visible)
- [ ] Videos proxy : lecture dans le modal fonctionne

---

## 16. RESPONSIVE / MOBILE

- [ ] Landing page lisible sur mobile
- [ ] Menu hamburger dans l'app
- [ ] Sidebar s'ouvre/ferme sur mobile
- [ ] Dashboard lisible (cards empilees)
- [ ] Modals (video detail, upsell) ferment correctement

---

## 17. SECURITE (CHECKLIST RAPIDE)

- [ ] Routes API protegees par `getUser()` (verifier 2-3 routes au hasard)
- [ ] Cron routes protegees par `CRON_SECRET` header
- [ ] Proxy image/video : seuls les domaines autorises passent
- [ ] Pas de code promo arbitraire (faille corrigee dans checkout)
- [ ] Webhook Stripe : signature verifiee en production
- [ ] Idempotence webhook : meme event traite une seule fois

---

## BUGS CONNUS (POST-MVP)

Ces elements sont documentes mais non bloquants pour le launch :

- [ ] 80 warnings TypeScript (pre-existants, pas d'erreurs de build)
- [ ] `multi_feature_use` upsell trigger pas encore implemente
- [ ] Pas de rate limiting explicite sur les routes de scraping
- [ ] Dashboard N+1 queries pour trending creators (performance)
- [ ] Les transactions credit ne sont pas atomiques (rare race condition)
