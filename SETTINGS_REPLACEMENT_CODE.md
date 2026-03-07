# 🔄 Code de remplacement pour settings/page.tsx

## Instructions

Dans `src/app/(app)/settings/page.tsx`, trouve et **REMPLACE complètement** la section qui commence par :

```typescript
{/* Buy credits packs — Version premium conversion-optimized */}
```

(ligne ~446)

Et qui se termine par :

```typescript
      </motion.div>

      {/* Upsell banner — affiché uniquement sur le plan Creator */}
```

(ligne ~823)

---

## Code de remplacement complet

```typescript
      {/* ═══ SECTION PRICING UNIFIÉE (PLANS → BP) ═══ */}
      
      {/* 1. PLANS — PRIORITÉ MRR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease }}
        className="mb-12"
      >
        {/* Header Plans */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-2xl tracking-wider text-brutify-text-primary mb-1">
                PLANS MENSUELS
              </h2>
              <p className="text-sm font-body text-brutify-text-secondary">
                Facturation récurrente · Réductions exclusives · Features avancées
              </p>
            </div>
            {/* Toggle mensuel / annuel */}
            <div className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5">
              <button
                onClick={() => setInterval("month")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-body font-medium transition-all duration-200",
                  interval === "month"
                    ? "bg-brutify-gold/10 text-brutify-gold"
                    : "text-brutify-text-muted hover:text-brutify-text-primary"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setInterval("year")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-body font-medium transition-all duration-200",
                  interval === "year"
                    ? "bg-brutify-gold/10 text-brutify-gold"
                    : "text-brutify-text-muted hover:text-brutify-text-primary"
                )}
              >
                Annuel
                <span className="rounded-full bg-brutify-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brutify-bg">
                  3 mois offerts
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS_DISPLAY.map((plan, i) => {
            const price = interval === "year" ? plan.yearlyPrice : plan.monthlyPrice
            const isCurrentPlan = currentPlan === plan.key
            const isPopular = plan.popular
            const hasActiveSub = Boolean(profile?.stripe_subscription_id)

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.2, ease }}
                className="relative"
              >
                {/* Badge Recommandé */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-brutify-gold text-brutify-bg text-[9px] font-bold rounded-full px-3 py-1 uppercase tracking-wide shadow-lg whitespace-nowrap">
                      ⭐ Recommandé
                    </span>
                  </div>
                )}

                {/* Card Premium */}
                <div
                  className={cn(
                    "relative rounded-2xl border p-6 transition-all duration-300 h-full flex flex-col",
                    "bg-gradient-to-b from-[#111113] to-[#0a0a0b]",
                    isPopular && "border-brutify-gold/30 shadow-[0_0_30px_rgba(255,171,0,0.15)] hover:shadow-[0_0_40px_rgba(255,171,0,0.2)]",
                    isCurrentPlan && "border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
                    !isPopular && !isCurrentPlan && "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  {/* Glow */}
                  {isPopular && (
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10 bg-brutify-gold" />
                  )}

                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="font-display text-2xl tracking-wider text-brutify-text-primary mb-1">
                      {plan.name.toUpperCase()}
                    </h3>
                    <p className="text-[11px] font-body text-brutify-text-muted">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-display text-4xl text-brutify-gold">
                        {price}
                      </span>
                      <span className="text-sm font-body text-brutify-text-muted">€/mois</span>
                    </div>
                    {interval === "year" && (
                      <p className="text-[10px] font-body text-green-400 mb-1">
                        Économise {plan.yearlyTotalSavings}€/an · Facturé {price * 12}€
                      </p>
                    )}
                    <p className="text-[10px] font-body text-brutify-text-muted">
                      {plan.credits} BP / mois
                    </p>
                  </div>

                  {/* Highlight + Discount BP */}
                  <div className="mb-5 space-y-2">
                    <div className="p-2 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20">
                      <p className="text-[11px] font-body text-brutify-gold font-semibold text-center">
                        {plan.highlight}
                      </p>
                    </div>
                    {plan.key !== "free" && (
                      <div className="p-2 rounded-lg bg-green-500/[0.08] border border-green-500/20">
                        <p className="text-[10px] font-body text-green-400 font-semibold text-center">
                          {plan.key === "creator" && "-15% sur recharges BP"}
                          {plan.key === "growth" && "-25% sur recharges BP"}
                          {plan.key === "scale" && "-40% sur recharges BP"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-brutify-gold/20">
                            <Check className="h-2.5 w-2.5 text-brutify-gold" />
                          </div>
                        </div>
                        <span className="text-[12px] font-body text-white/80">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Premium */}
                  {isCurrentPlan ? (
                    <div className="w-full rounded-xl py-3.5 text-sm font-body font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Plan actuel</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePlanClick(plan.key, interval)}
                      disabled={loadingPlan !== null}
                      className={cn(
                        "w-full rounded-xl py-3.5 text-sm font-body font-bold transition-all duration-200",
                        "flex items-center justify-center gap-2",
                        isPopular && "bg-gold-gradient text-brutify-bg shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.4)] hover:scale-[1.02] active:scale-[0.98]",
                        !isPopular && "bg-white/[0.08] text-brutify-text-primary hover:bg-white/[0.12] hover:scale-[1.01]",
                        "disabled:opacity-50 disabled:hover:scale-100"
                      )}
                    >
                      {loadingPlan === plan.key ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Chargement...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>
                            {currentPlan === "free" && plan.key === "creator"
                              ? "Tester 7 jours gratuits"
                              : `Passer en ${plan.name}`}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Trial info */}
                  {plan.key === "creator" && currentPlan === "free" && !isCurrentPlan && (
                    <p className="mt-3 text-center text-[10px] font-body text-green-400">
                      7j gratuits · Sans CB · Annulation auto
                    </p>
                  )}
                  {hasActiveSub && !isCurrentPlan && (planOrderMap[plan.key] ?? 0) > (planOrderMap[currentPlan] ?? 0) && (
                    <p className="mt-3 text-center text-[10px] font-body text-green-400/70">
                      Payez seulement la différence au prorata
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Lien vers Stripe Portal */}
        {currentPlan !== "free" && profile?.stripe_subscription_id && (
          <div className="mt-6 text-center">
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="inline-flex items-center gap-2 text-xs font-body text-brutify-text-muted hover:text-brutify-gold transition-colors"
            >
              {loadingPortal ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ExternalLink className="h-3 w-3" />
              )}
              Gérer · Résilier à tout moment
            </button>
          </div>
        )}
      </motion.div>

      {/* 2. PACKS BP — ANCRAGE PSYCHOLOGIQUE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease }}
        className="mb-10"
      >
        {/* Header BP */}
        <div className="mb-6">
          <h2 className="font-display text-xl tracking-wider text-brutify-text-primary mb-2">
            RECHARGES PONCTUELLES
          </h2>
          <p className="text-sm font-body text-brutify-text-secondary mb-3">
            Paiement unique · Crédits instantanés
          </p>
          
          {/* Ancrage selon le plan */}
          {currentPlan !== "free" ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/[0.08] border border-green-500/20">
              <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-body text-white/90">
                <span className="text-green-400 font-semibold">Abonné {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} :</span>{" "}
                Tu bénéficies de{" "}
                <span className="text-green-400 font-semibold">
                  {currentPlan === "scale" ? "-40%" : currentPlan === "growth" ? "-25%" : "-15%"}
                </span>{" "}
                sur toutes les recharges !
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-brutify-gold/[0.04] border border-brutify-gold/10">
              <AlertCircle className="h-4 w-4 text-brutify-gold shrink-0 mt-0.5" />
              <p className="text-[11px] font-body text-brutify-text-muted">
                <span className="text-brutify-gold font-semibold">Astuce :</span> Les plans mensuels sont{" "}
                <span className="text-brutify-gold font-semibold">jusqu'à 85% moins chers</span> au BP et incluent des{" "}
                <span className="text-brutify-gold font-semibold">réductions exclusives</span> sur toutes les recharges !
              </p>
            </div>
          )}
        </div>

        {/* Grid BP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack, i) => {
            const displayAmount = pack.actualBp ?? pack.amount
            const hasBonus = pack.bonusBp && pack.bonusBp > 0
            const isPopular = pack.badge === "POPULAIRE"
            const isBestDeal = pack.badge === "+20% OFFERT"
            
            // Calculer le prix avec réduction abonné
            const basePrice = pack.price
            let userPrice = basePrice
            let discount = null
            
            if (currentPlan === "scale") {
              userPrice = Math.round(basePrice * 0.6) // -40%
              discount = "-40%"
            } else if (currentPlan === "growth") {
              userPrice = Math.round(basePrice * 0.75) // -25%
              discount = "-25%"
            } else if (currentPlan === "creator") {
              userPrice = Math.round(basePrice * 0.85) // -15%
              discount = "-15%"
            }

            return (
              <motion.div
                key={pack.amount}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.2, ease }}
                className="relative"
              >
                {/* Badge */}
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className={cn(
                      "text-[9px] font-bold rounded-full px-3 py-1 uppercase tracking-wide shadow-lg whitespace-nowrap",
                      isPopular && "bg-brutify-gold text-brutify-bg",
                      isBestDeal && "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    )}>
                      {pack.badge}
                    </span>
                  </div>
                )}

                {/* Card */}
                <div
                  className={cn(
                    "relative rounded-2xl border p-5 transition-all duration-300 h-full flex flex-col",
                    "bg-gradient-to-b from-[#111113] to-[#0a0a0b]",
                    isPopular && "border-brutify-gold/30 shadow-[0_0_30px_rgba(255,171,0,0.15)] hover:shadow-[0_0_40px_rgba(255,171,0,0.2)]",
                    isBestDeal && "border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]",
                    !pack.badge && "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  {/* Glow */}
                  {(isPopular || isBestDeal) && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10",
                      isPopular && "bg-brutify-gold",
                      isBestDeal && "bg-green-500"
                    )} />
                  )}

                  {/* BP amount */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display text-3xl tracking-wider text-brutify-text-primary">
                        {displayAmount}
                      </span>
                      <span className="text-xs font-body text-brutify-text-muted">BP</span>
                    </div>
                    {hasBonus && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1 w-1 rounded-full bg-green-400" />
                        <p className="text-[10px] font-bold text-green-400">
                          +{pack.bonusBp} BP offerts
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="mb-4 flex-1">
                    <div className="flex items-baseline gap-1 mb-1">
                      {discount && (
                        <span className="text-lg font-display text-white/40 line-through mr-1">
                          {basePrice}€
                        </span>
                      )}
                      <span className="font-display text-2xl text-brutify-gold">
                        {userPrice}
                      </span>
                      <span className="text-xs font-body text-brutify-text-muted">€</span>
                      {discount && (
                        <span className="ml-1 text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                          {discount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-body text-brutify-text-muted">
                      {pack.pricePerBp}
                      {discount && <span className="text-green-400 ml-1">(abonné)</span>}
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleBuyCredits(pack.amount)}
                    disabled={loadingCredits !== null}
                    className={cn(
                      "w-full rounded-xl py-2.5 text-xs font-body font-bold transition-all duration-200",
                      "flex items-center justify-center gap-2",
                      isPopular && "bg-gold-gradient text-brutify-bg shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.4)] hover:scale-[1.02]",
                      isBestDeal && "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-[1.02]",
                      !pack.badge && "bg-white/[0.06] text-brutify-text-primary hover:bg-white/[0.1] hover:scale-[1.01]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {loadingCredits === pack.amount ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Acheter</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer sécurité */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-body text-brutify-text-muted/50">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-[#635BFF] flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">S</span>
            </div>
            <span>Paiement sécurisé Stripe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-400" />
            <span>Crédits instantanés</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-400" />
            <span>Pas d'engagement</span>
          </div>
        </div>
      </motion.div>
```

---

## ⚠️ À FAIRE APRÈS (logique serveur)

Il faudra implémenter la réduction côté serveur dans `/api/stripe/buy-credits/route.ts` :

```typescript
// Récupérer le plan de l'user
const { data: profile } = await supabase
  .from("profiles")
  .select("plan, stripe_customer_id")
  .eq("id", user.id)
  .single()

// Calculer le prix réduit
let finalPrice = pack.price
if (profile?.plan === "scale") finalPrice = Math.round(pack.price * 0.6)
else if (profile?.plan === "growth") finalPrice = Math.round(pack.price * 0.75)
else if (profile?.plan === "creator") finalPrice = Math.round(pack.price * 0.85)

// Créer un coupon dynamique Stripe pour appliquer la réduction
// OU créer des Price IDs séparés par plan
```

---

🎯 **Copie-colle ce code** à la place de l'ancienne section BP + Plans !
