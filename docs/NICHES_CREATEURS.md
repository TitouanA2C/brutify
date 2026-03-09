# Attribuer des niches aux créateurs

Les créateurs en base ont une colonne `niche` (ex. "Business", "Fitness"). Si elle est à `null`, l’onboarding ne peut pas les afficher pour l’étape "Créateurs [Niche]". Voici comment remplir cette niche.

---

## Option A — Créateurs déjà en base (niche = null)

**Route : `GET /api/cron/backfill-creators-niche`**

- Prend tous les créateurs avec `niche` = null.
- Pour chacun, regarde les utilisateurs qui le suivent (watchlist).
- Si au moins un de ces utilisateurs a une **niche** dans son profil, on met à jour le créateur avec cette niche.

**Quand l’utiliser :** quand tu as déjà des créateurs en base (ajoutés à la main ou par le passé) et qu’ils n’ont pas de niche.

**Exemple :**
```bash
curl -H "Authorization: Bearer TON_CRON_SECRET" "https://ton-app.com/api/cron/backfill-creators-niche"
```

---

## Option B — Remplir par niche avec Discover (Apify)

**Route : `GET /api/cron/seed-creators?niche=business`** (ou sans `?niche=` pour toutes les niches)

- Pour une (ou toutes) niche(s) built-in, appelle l’API **Discover** (Apify) qui retourne des créateurs Instagram pour cette niche.
- Pour chaque créateur trouvé : **insert** s’il n’existe pas, **update** s’il existe déjà (handle identique), en mettant **niche = label** (ex. "Business").

**Quand l’utiliser :** pour avoir des créateurs "par niche" (ex. Business, Fitness) et que l’onboarding en affiche. Les créateurs déjà en base et qui font partie du résultat Discover reçoivent aussi leur niche à ce moment-là.

**Exemples :**
```bash
# Une seule niche (ex. business)
curl -H "Authorization: Bearer TON_CRON_SECRET" "https://ton-app.com/api/cron/seed-creators?niche=business"

# Toutes les niches built-in
curl -H "Authorization: Bearer TON_CRON_SECRET" "https://ton-app.com/api/cron/seed-creators"
```

---

## Résumé

| Situation | Route à appeler |
|-----------|------------------|
| Créateurs déjà en base, sans niche → attribuer la niche des users qui les suivent | `GET /api/cron/backfill-creators-niche` |
| Remplir / mettre à jour des créateurs par niche (Discover Apify) | `GET /api/cron/seed-creators?niche=...` |

Les deux routes sont protégées par **CRON_SECRET** (header `Authorization: Bearer <CRON_SECRET>`).
