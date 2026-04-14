"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Crown,
  Zap,
  ScrollText,
  FileText,
  Brain,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Bell,
  Shield,
  Trash2,
  LogOut,
  Globe,
  User,
  Mail,
  Edit3,
  Target,
  Mic,
  PenTool,
  Users,
  Video,
  Instagram,
  Youtube,
  Link2,
  TrendingUp,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GoldText } from "@/components/ui/GoldText";
import { useUser } from "@/hooks/useUser";
import { useCredits } from "@/lib/credits-context";
import { useToast } from "@/lib/toast-context";
import { PLANS } from "@/lib/stripe/config";
import { cn } from "@/lib/utils";
import { SocialAvatar, proxyImg } from "@/components/settings/SocialAvatar";
import { ScrapeStatusBlock } from "@/components/settings/ScrapeStatusBlock";
import type { ScrapeState, SocialPlatform } from "@/components/settings/ScrapeStatusBlock";
import { SocialHandleField } from "@/components/settings/SocialHandleField";
import { PricingSection } from "@/components/settings/PricingSection";
import { RetentionModal } from "@/components/retention/RetentionModal";
import { Loading } from "@/components/ui/Loading";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

type PlanKey = "creator" | "growth" | "scale";
type Interval = "month" | "year";

interface PlanDisplay {
  key: PlanKey;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyTotalSavings: number;
  credits: number;
  highlight: string;
  features: string[];
  popular?: boolean;
  bpDiscount?: number;
}

const PLANS_DISPLAY: PlanDisplay[] = [
  {
    key: "creator",
    name: "Creator",
    tagline: "Pour commencer à scaler",
    monthlyPrice: 19,
    yearlyPrice: 14,
    yearlyTotalSavings: 60,
    credits: 500,
    highlight: "~250 scripts / mois",
    bpDiscount: 15,
    features: [
      "500 Brutpoints / mois",
      "Scripts IA (2 BP / script)",
      "BrutBoard",
      "Dashboard créateurs",
      "Radar jusqu'à 10 créateurs",
      "-15% sur recharges BP",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    tagline: "Pour les créateurs sérieux",
    monthlyPrice: 39,
    yearlyPrice: 28,
    yearlyTotalSavings: 132,
    credits: 2000,
    highlight: "~1 000 scripts / mois",
    popular: true,
    bpDiscount: 25,
    features: [
      "2 000 Brutpoints / mois",
      "Tout Creator inclus",
      "Transcription vidéo (3 BP)",
      "Analyse IA deep (5 BP)",
      "Inspiration IA (4 BP)",
      "Radar illimité",
      "-25% sur recharges BP",
    ],
  },
  {
    key: "scale",
    name: "Scale",
    tagline: "Pour les équipes & agences",
    monthlyPrice: 79,
    yearlyPrice: 57,
    yearlyTotalSavings: 264,
    credits: 3000,
    highlight: "Pour les équipes & agences",
    bpDiscount: 40,
    features: [
      "3 000 Brutpoints / mois",
      "Tout Growth inclus",
      "Multi-utilisateurs (3 seats)",
      "Export scripts & analyses",
      "Support prioritaire",
      "-40% sur recharges BP",
    ],
  },
];

const maxCreditsMap: Record<PlanKey, number> = {
  creator: PLANS.creator.credits,
  growth: PLANS.growth.credits,
  scale: PLANS.scale.credits,
};

const actionIcons: Record<string, typeof ScrollText> = {
  "Script forgé": ScrollText,
  Transcription: FileText,
  "Analyse IA": Brain,
};

function getActionIcon(action: string) {
  for (const [key, Icon] of Object.entries(actionIcons)) {
    if (action.startsWith(key)) return Icon;
  }
  return Zap;
}

type Tab = "profil" | "abonnement" | "parametres";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("abonnement");
  const { profile, refreshProfile } = useUser();

  // Récupérer le code promo depuis l'URL
  const promoCode = searchParams.get("promo");

  // Rafraîchir le profil au chargement de la page pour éviter décalage front/back (plan, crédits)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "abonnement") setActiveTab("abonnement");
    else if (tab === "parametres") setActiveTab("parametres");
    else setActiveTab("profil");
  }, [searchParams]);

  // Détecter un changement de plan réussi
  useEffect(() => {
    const planChanged = searchParams.get("plan_changed");
    const newPlan = searchParams.get("new_plan");
    
    if (planChanged === "true" && newPlan) {
      console.log(`[Settings] Plan changé vers: ${newPlan}`);
      // Rafraîchir le profil pour afficher le nouveau plan
      refreshProfile();
      
      // Nettoyer l'URL après 2 secondes
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("plan_changed");
        url.searchParams.delete("new_plan");
        window.history.replaceState({}, "", url.toString());
      }, 2000);
    }
  }, [searchParams, refreshProfile]);

  // Dev credit — guarded to development only
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const devCredit = searchParams.get("dev_credit");
    const amount = searchParams.get("amount");
    
    if (devCredit === "true" && amount) {
      const creditAmount = Number(amount);
      if (creditAmount > 0) {
        fetch("/api/stripe/dev-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: creditAmount }),
        })
          .then(() => refreshProfile())
          .catch(() => {});
        
        const url = new URL(window.location.href);
        url.searchParams.delete("dev_credit");
        url.searchParams.delete("amount");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, refreshProfile]);
  const { credits, history, historyLoading } = useCredits();
  const [interval] = useState<Interval>("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState<number | null>(null);

  // Modal de confirmation upgrade avec proration
  const [upgradeModal, setUpgradeModal] = useState<{
    plan: PlanKey;
    planName: string;
    newMonthlyPrice: number;
    currentMonthlyPrice: number;
    prorationAmount: number | null;
    loadingPreview: boolean;
  } | null>(null);

  // Modal anti-churn (retention offers)
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  const currentPlan = (profile?.plan ?? "creator") as PlanKey;
  const hasActiveSub = !!(profile as Record<string, unknown>)?.stripe_subscription_id;
  const maxCredits = maxCreditsMap[currentPlan];
  const displayCredits = profile?.credits ?? credits;
  const pct = Math.min(100, Math.round((displayCredits / maxCredits) * 100));

  const planOrderMap: Record<string, number> = { creator: 1, growth: 2, scale: 3 };

  // Ouvre le modal de confirmation et charge le preview proration
  const handlePlanClick = useCallback(
    async (plan: PlanKey, selectedInterval?: Interval) => {
      if (plan === currentPlan) return;
      
      const activeInterval = selectedInterval ?? interval

      const targetPlan = PLANS_DISPLAY.find((p) => p.key === plan);
      if (!targetPlan) return;

      const currentPlanData = PLANS_DISPLAY.find((p) => p.key === currentPlan);
      const currentMonthlyPrice = currentPlanData?.monthlyPrice ?? 0;
      const isUpgrade = (planOrderMap[plan] ?? 0) > (planOrderMap[currentPlan] ?? 0);

      // Si pas d'abonnement actif → checkout classique
      if (!hasActiveSub) {
        setLoadingPlan(plan);
        try {
          const payload: { plan: PlanKey; interval: Interval; promoCode?: string } = {
            plan,
            interval: activeInterval,
          };
          
          // Ajouter le code promo si présent
          if (promoCode) {
            payload.promoCode = promoCode;
          }
          
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
        } catch (err) {
          console.error("Checkout error:", err);
        }
        setLoadingPlan(null);
        return;
      }

      // Abonnement existant → ouvre modal avec proration preview
      setUpgradeModal({
        plan,
        planName: targetPlan.name,
        newMonthlyPrice: activeInterval === "year" ? targetPlan.yearlyPrice : targetPlan.monthlyPrice,
        currentMonthlyPrice: activeInterval === "year"
          ? (currentPlanData?.yearlyPrice ?? currentMonthlyPrice)
          : currentMonthlyPrice,
        prorationAmount: null,
        loadingPreview: isUpgrade, // on ne fetch la proration que pour les upgrades
      });

      // Charge la proration preview seulement pour les upgrades
      if (isUpgrade) {
        try {
          const res = await fetch("/api/stripe/proration-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, interval: activeInterval }),
          });
          const data = await res.json();
          if (!data.error) {
            setUpgradeModal((prev) =>
              prev ? { ...prev, prorationAmount: Math.round(data.amountDue / 100), loadingPreview: false } : null
            );
          } else {
            setUpgradeModal((prev) => prev ? { ...prev, loadingPreview: false } : null);
          }
        } catch {
          setUpgradeModal((prev) => prev ? { ...prev, loadingPreview: false } : null);
        }
      }
    },
    [currentPlan, hasActiveSub, interval]
  );

  // Exécute l'upgrade après confirmation dans le modal
  const handleConfirmUpgrade = useCallback(async () => {
    if (!upgradeModal) return;
    setLoadingPlan(upgradeModal.plan);
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: upgradeModal.plan, interval }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        // Redirection vers Stripe Checkout (ex. upgrade avec abo test → voir la page de paiement)
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.success) {
        await refreshProfile();
        setUpgradeModal(null);
      }
    } catch (err) {
      console.error("Upgrade error:", err);
    }
    setLoadingPlan(null);
  }, [upgradeModal, interval, refreshProfile]);

  const handlePortal = useCallback(async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
    setLoadingPortal(false);
  }, []);

  // Ouvrir le retention modal au lieu du portal
  const handleCancelAttempt = useCallback(() => {
    if (hasActiveSub) {
      setShowRetentionModal(true);
    } else {
      handlePortal();
    }
  }, [hasActiveSub, handlePortal]);

  // Accepter une offre de rétention
  const handleAcceptRetentionOffer = useCallback(
    async (offerType: "discount" | "pause" | "downgrade") => {
      try {
        const res = await fetch("/api/stripe/retention-offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerType }),
        });
        const data = await res.json();
        if (data.success) {
          await refreshProfile();
          setShowRetentionModal(false);
        }
      } catch (err) {
        console.error("Retention offer error:", err);
      }
    },
    [refreshProfile]
  );

  // Confirmer l'annulation (après avoir refusé toutes les offres)
  const handleConfirmCancelSubscription = useCallback(() => {
    setShowRetentionModal(false);
    handlePortal(); // Ouvre le Stripe Portal pour annuler
  }, [handlePortal]);

  const handleBuyCredits = useCallback(
    async (amount: number) => {
      setLoadingCredits(amount);
      try {
        const res = await fetch("/api/stripe/buy-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error("Buy credits error:", err);
      }
      setLoadingCredits(null);
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="max-w-[1400px] mx-auto"
    >
      <PageHeader
        title="Paramètres"
        subtitle="Gère ton plan, tes Brutpoints et tes préférences"
      />

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-8 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit mx-auto overflow-x-auto pb-2">
        {([
          { key: "profil"      as Tab, icon: <User className="h-3.5 w-3.5" />,       label: "Profil" },
          { key: "abonnement"  as Tab, icon: <CreditCard className="h-3.5 w-3.5" />, label: "Abonnement" },
          { key: "parametres"  as Tab, icon: <Globe className="h-3.5 w-3.5" />,      label: "Paramètres" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-medium transition-all duration-200 cursor-pointer",
              activeTab === t.key
                ? "bg-brutify-gold/[0.12] border border-brutify-gold/30 text-brutify-gold shadow-[0_0_30px_rgba(255,171,0,0.25)]"
                : "border border-transparent text-brutify-text-muted hover:text-brutify-text-primary hover:shadow-[0_0_12px_rgba(255,171,0,0.08)]"
            )}
          >
            {activeTab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-brutify-gold rounded-full shadow-[0_0_8px_rgba(255,171,0,0.5)]" />}
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

      {activeTab === "profil" ? (
        <ProfileTab />
      ) : activeTab === "abonnement" ? (
      <motion.div key="abonnement" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Credits overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease }}
        className="mb-8"
      >
        <Card hoverable={false} className="relative overflow-hidden p-6 border-brutify-gold/20 shadow-[0_0_40px_rgba(255,171,0,0.15)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 80% 20%, #FFAB00 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-5 w-5 text-brutify-gold" />
                <h2 className="font-display text-xl tracking-wider text-brutify-text-primary">
                  BRUTPOINTS
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-body text-brutify-text-secondary">
                  Plan{" "}
                  <span className="text-brutify-gold font-semibold capitalize">
                    {currentPlan}
                  </span>
                </p>
                {profile?.stripe_subscription_id && (
                  <button
                    onClick={handlePortal}
                    disabled={loadingPortal}
                    className="inline-flex items-center gap-1 text-xs font-body text-brutify-text-muted hover:text-brutify-gold transition-colors cursor-pointer"
                  >
                    {loadingPortal ? (
                      <Loading variant="icon" size="sm" className="shrink-0" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                    Gérer
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <GoldText as="p" className="font-display text-3xl sm:text-5xl">
                {displayCredits}
              </GoldText>
              <p className="text-xs font-body text-brutify-text-muted mt-0.5">
                sur {maxCredits} BP
              </p>
            </div>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.06] mb-2">
            <div
              className="h-full rounded-full bg-gold-gradient shadow-[0_0_6px_rgba(255,171,0,0.3)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-body text-brutify-text-muted">
              {displayCredits} BP restants
            </p>
            <p className="text-xs font-body text-brutify-text-muted">
              {Math.max(0, maxCredits - displayCredits)} utilisés
            </p>
          </div>

          <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <ScrollText className="h-4 w-4" />, label: "Forger un script", cost: "2 BP" },
              { icon: <FileText className="h-4 w-4" />, label: "Transcrire", cost: "3 BP" },
              { icon: <Brain className="h-4 w-4" />, label: "Analyser", cost: "5 BP" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease }}
              >
                <CostCard icon={item.icon} label={item.label} cost={item.cost} />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ═══ PRICING SECTION (Plans → BP) ═══ */}
      <PricingSection
        currentPlan={currentPlan}
        hasActiveSub={hasActiveSub}
        onPlanClick={handlePlanClick}
        onBuyCredits={handleBuyCredits}
        onCancelAttempt={handleCancelAttempt}
        promoCode={promoCode}
        loadingPlan={loadingPlan}
        loadingCredits={loadingCredits}
      />

      {/* Upsell banner — affiché uniquement sur le plan Creator */}
      {currentPlan === "creator" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.22, ease }}
          className="mb-8"
        >
          <div className="relative rounded-2xl border border-brutify-gold/20 bg-gradient-to-r from-brutify-gold/[0.06] via-brutify-gold/[0.03] to-transparent p-5 overflow-hidden">
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.07]"
              style={{ background: "radial-gradient(ellipse at right, #FFAB00 0%, transparent 60%)" }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-brutify-gold" />
                  <span className="text-xs font-display uppercase tracking-widest text-brutify-gold">
                    Débloque 4× plus de puissance
                  </span>
                </div>
                <p className="text-sm font-body text-brutify-text-primary font-semibold mb-1">
                  Tu es sur Creator · Passe en Growth
                </p>
                <p className="text-xs font-body text-brutify-text-secondary leading-relaxed mb-3">
                  +1 500 BP/mois · Transcription · Analyse IA · Inspiration IA.
                  {hasActiveSub && (
                    <span className="text-green-400">
                      {" "}Payez seulement la différence (~{interval === "year" ? "14€" : "20€"}) pour finir le mois.
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePlanClick("growth")}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === "growth" ? (
                      <Loading variant="icon" size="sm" className="shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    Passer en Growth — {interval === "year" ? "28€" : "39€"}/mois
                  </Button>
                  <span className="text-[10px] font-body text-brutify-text-muted">
                    Résiliable à tout moment
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-1">
                <div className="text-right">
                  <p className="text-[10px] font-body text-brutify-text-muted">Creator</p>
                  <p className="font-display text-lg text-brutify-text-muted line-through">500 BP</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-body text-brutify-gold">Growth</p>
                  <p className="font-display text-lg text-brutify-gold">2 000 BP</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de confirmation upgrade avec proration */}
      <AnimatePresence>
        {upgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !loadingPlan && setUpgradeModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111113] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-lg tracking-wider text-brutify-text-primary">
                    PASSER EN {upgradeModal.planName.toUpperCase()}
                  </h3>
                  <p className="text-[11px] font-body text-brutify-text-muted mt-0.5">
                    Confirmation de changement de plan
                  </p>
                </div>
                <button
                  onClick={() => setUpgradeModal(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-colors"
                >
                  <X className="h-4 w-4 text-brutify-text-muted" />
                </button>
              </div>

              {/* Comparaison plans */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center">
                    <p className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider mb-1">
                      Plan actuel
                    </p>
                    <p className="font-display text-2xl text-brutify-text-secondary line-through">
                      {upgradeModal.currentMonthlyPrice}€
                    </p>
                    <p className="text-[10px] text-brutify-text-muted">/mois</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-brutify-gold" />
                  <div className="text-center">
                    <p className="text-[10px] font-body text-brutify-gold uppercase tracking-wider mb-1">
                      {upgradeModal.planName}
                    </p>
                    <p className="font-display text-2xl text-brutify-gold">
                      {upgradeModal.newMonthlyPrice}€
                    </p>
                    <p className="text-[10px] text-brutify-text-muted">/mois</p>
                  </div>
                </div>

                {/* Montant à payer maintenant */}
                <div className="border-t border-white/[0.05] pt-3">
                  {upgradeModal.loadingPreview ? (
                    <Loading variant="inline" label="Calcul du montant proraté…" className="justify-center py-2" />
                  ) : upgradeModal.prorationAmount !== null ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-body text-brutify-text-secondary font-semibold">
                          À payer maintenant (prorata)
                        </p>
                        <p className="text-[10px] font-body text-brutify-text-muted">
                          Différence pour le reste du mois en cours
                        </p>
                      </div>
                      <p className="font-display text-xl text-brutify-gold">
                        {upgradeModal.prorationAmount}€
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-brutify-gold shrink-0" />
                      <p className="text-[11px] font-body text-brutify-text-secondary">
                        Vous payez seulement la différence au prorata pour le mois en cours,
                        puis {upgradeModal.newMonthlyPrice}€/mois.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Points clés */}
              <ul className="space-y-2 mb-5">
                {[
                  "Activation immédiate — BP crédités instantanément",
                  "Prorata automatique — pas de double facturation",
                  "Résiliable à tout moment depuis les paramètres",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[11px] font-body text-brutify-text-secondary">
                    <Check className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>

              {/* Offre de rétention : affichée uniquement en cas de downgrade */}
              {(planOrderMap[currentPlan] ?? 0) > (planOrderMap[upgradeModal.plan] ?? 0) && (
                <div className="mb-5 rounded-xl border border-brutify-gold/40 bg-gradient-to-r from-brutify-gold/15 to-brutify-gold/5 p-4">
                  <p className="text-[11px] font-semibold text-brutify-gold uppercase tracking-wider mb-2">
                    🎁 Offre pour rester
                  </p>
                  <p className="text-[12px] font-body text-brutify-text-primary mb-2">
                    Restez en <span className="font-semibold text-brutify-gold">{currentPlan === "growth" ? "Growth" : "Scale"}</span> à -30% pendant 3 mois, ou gardez tout sans changer.
                  </p>
                  <ul className="space-y-1 text-[11px] font-body text-brutify-text-secondary mb-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400 shrink-0" />
                      -30% pendant 3 mois sur ton plan actuel
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400 shrink-0" />
                      Aucun changement de features ni de BP
                    </li>
                  </ul>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-brutify-gold/90 hover:bg-brutify-gold text-black font-semibold"
                    onClick={async () => {
                      setUpgradeModal(null);
                      try {
                        await handleAcceptRetentionOffer("discount");
                        await refreshProfile();
                      } catch (err) {
                        console.error("Retention offer error:", err);
                      }
                    }}
                    disabled={!!loadingPlan}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Profiter de l&apos;offre -30%
                  </Button>
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setUpgradeModal(null)}
                  disabled={!!loadingPlan}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleConfirmUpgrade}
                  disabled={!!loadingPlan || upgradeModal.loadingPreview}
                >
                  {loadingPlan ? (
                    <Loading variant="icon" size="sm" className="shrink-0" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmer l&apos;upgrade
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retention Modal (anti-churn) */}
      {showRetentionModal && (
        <RetentionModal
          currentPlan={currentPlan as "creator" | "growth" | "scale"}
          monthlyPrice={
            currentPlan === "creator" ? 19 :
            currentPlan === "growth" ? 39 :
            currentPlan === "scale" ? 79 : 0
          }
          onClose={() => setShowRetentionModal(false)}
          onAcceptOffer={handleAcceptRetentionOffer}
          onConfirmCancel={handleConfirmCancelSubscription}
        />
      )}

      {/* Usage history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease }}
      >
        <h2 className="font-display text-lg tracking-wider text-brutify-text-primary mb-4">
          HISTORIQUE
        </h2>
        <Card hoverable={false} className="p-0 overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {historyLoading ? (
              <div className="px-5 py-8 flex justify-center">
                <Loading variant="block" size="md" />
              </div>
            ) : history.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-body text-brutify-text-muted">
                  Aucune activité pour le moment
                </p>
              </div>
            ) : (
              history.map((entry, i) => {
                const Icon = getActionIcon(entry.actionLabel ?? entry.action);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.03, duration: 0.3, ease }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] shrink-0">
                      <Icon className="h-4 w-4 text-brutify-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-brutify-text-primary truncate">
                        {entry.actionLabel ?? entry.action}
                      </p>
                      <p className="text-[10px] font-body text-brutify-text-muted">
                        {entry.date}
                      </p>
                    </div>
                    <span className="text-sm font-body font-medium text-brutify-danger shrink-0">
                      -{entry.cost} BP
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>
      </motion.div> ) : (

      /* ── Onglet Paramètres ── */
      <motion.div
        key="parametres"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Notifications */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
            <Bell className="h-4 w-4 text-brutify-gold" />
            <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-primary">Notifications</h3>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm font-body text-brutify-text-muted">
              Les préférences de notifications arrivent bientôt. Tu recevras toutes les notifications importantes par défaut.
            </p>
          </div>
        </div>

        {/* Sécurité */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
            <Shield className="h-4 w-4 text-blue-400" />
            <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-primary">Sécurité</h3>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div>
                <p className="text-sm font-body font-medium text-brutify-text-primary">Mot de passe</p>
                <p className="text-[11px] font-body text-brutify-text-muted mt-0.5">Géré via ton provider d&apos;authentification</p>
              </div>
              <span className="text-[11px] font-body text-brutify-text-muted/50 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1">
                Google / Email
              </span>
            </div>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
            <LogOut className="h-4 w-4 text-brutify-text-muted" />
            <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-primary">Déconnexion</h3>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-brutify-text-primary">Se déconnecter de son compte</p>
                <p className="text-[11px] font-body text-brutify-text-muted mt-0.5">Tu pourras te reconnecter à tout moment avec le même compte</p>
              </div>
              <a
                href="/api/auth/logout"
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-body font-semibold text-brutify-text-secondary hover:text-brutify-danger hover:bg-brutify-danger/[0.06] hover:border-brutify-danger/20 transition-all cursor-pointer inline-block"
              >
                Se déconnecter
              </a>
            </div>
          </div>
        </div>

        {/* Zone danger */}
        <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/[0.06] overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/[0.15]">
            <Trash2 className="h-4 w-4 text-red-400" />
            <h3 className="font-display text-sm uppercase tracking-widest text-red-400">Zone danger</h3>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-brutify-text-primary">Supprimer mon compte</p>
                <p className="text-[11px] font-body text-brutify-text-muted mt-0.5">Action irréversible — toutes tes données seront effacées</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.")) {
                    fetch("/api/profile", { method: "DELETE" })
                      .then(res => {
                        if (res.ok) window.location.href = "/login";
                        else alert("Erreur lors de la suppression. Contacte le support.");
                      })
                      .catch(() => alert("Erreur réseau. Réessaie."));
                  }
                }}
                className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs font-body font-semibold text-red-400 hover:bg-red-500/[0.12] transition-all cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Profile tab ────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string; email: string; full_name: string | null; avatar_url: string | null;
  plan: string; credits: number; niche: string | null; tone_of_voice: string | null;
  writing_style: string | null; created_at: string;
  instagram_handle: string | null; tiktok_handle: string | null; youtube_handle: string | null;
}
interface ProfileStats { creators: number; videos: number; scripts: number; }
interface NetworkStats {
  platform: string; creator_id: string; handle: string; name: string | null;
  avatar_url: string | null; bio: string | null; followers: number;
  posts_count: number; avg_views: number; engagement_rate: number; growth_rate: number;
  total_views: number; total_likes: number; total_comments: number; scraped_videos: number;
}

function InlineField({
  label, icon, value, placeholder, onSave, readOnly,
}: { label: string; icon: React.ReactNode; value: string; placeholder: string; onSave: (v: string) => Promise<void>; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(value); }, [value]);
  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true); await onSave(draft); setSaving(false); setEditing(false);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-body font-medium uppercase tracking-wider text-brutify-text-muted/60">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>{label}
      </label>
      {editing ? (
        <div className="flex items-center gap-2">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
            className="flex-1 rounded-xl border-2 border-brutify-gold/30 bg-white/[0.03] px-3 py-2 text-sm font-body text-brutify-text-primary outline-none focus:border-brutify-gold/50 focus:shadow-[0_0_20px_rgba(255,171,0,0.15)] transition-all"
            placeholder={placeholder} />
          <button onClick={save} disabled={saving} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brutify-gold/10 border border-brutify-gold/20 text-brutify-gold hover:bg-brutify-gold/20 transition-all cursor-pointer">
            {saving ? <Loading variant="icon" size="sm" className="shrink-0" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-brutify-text-muted hover:border-white/[0.12] transition-all cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="group flex items-center justify-between rounded-xl border border-brutify-gold/10 bg-white/[0.02] px-3 py-2.5 transition-all hover:border-brutify-gold/30 hover:shadow-[0_0_12px_rgba(255,171,0,0.08)]">
          <span className={cn("text-sm font-body", value ? "text-brutify-text-primary" : "text-brutify-text-muted/50")}>{value || placeholder}</span>
          {!readOnly && (
            <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-md text-brutify-text-muted hover:text-brutify-gold cursor-pointer">
              <Edit3 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}


function ProfileTab() {
  const router = useRouter();
  const toast = useToast();
  const { profile: ctxProfile, refreshProfile } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ creators: 0, videos: 0, scripts: 0 });
  const [networks, setNetworks] = useState<NetworkStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [scrapeStates, setScrapeStates] = useState<Record<SocialPlatform, ScrapeState>>({
    instagram: { status: "idle", result: null, error: null },
    tiktok:    { status: "idle", result: null, error: null },
    youtube:   { status: "idle", result: null, error: null },
  });

  const reloadProfile = useCallback(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.profile) setProfileData(d.profile);
      if (d.stats) setStats(d.stats);
      if (d.networks) setNetworks(d.networks);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { reloadProfile(); }, [reloadProfile]);

  const updateField = useCallback(async (field: string, value: string) => {
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    const data = await res.json();
    if (data.profile) {
      setProfileData(data.profile);
      // Non-blocking context refresh
      refreshProfile().catch(() => {});
    }
  }, [refreshProfile]);

  const setScrape = useCallback((platform: SocialPlatform, patch: Partial<ScrapeState>) => {
    setScrapeStates(prev => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  }, []);

  const scrapeAndAdd = useCallback(async (platform: SocialPlatform, handle: string) => {
    if (!handle) return;
    setScrape(platform, { status: "step1", result: null, error: null });

    try {
      await new Promise(r => setTimeout(r, 600));
      setScrape(platform, { status: "step2" });

      const scrapeRes = await fetch(`/api/scraping/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok || !scrapeData.creator) {
        setScrape(platform, { status: "error", error: scrapeData.error ?? "Profil introuvable" });
        return;
      }

      setScrape(platform, { status: "step3" });
      const watchRes = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_id: scrapeData.creator.id }),
      });
      const watchData = await watchRes.json().catch(() => ({}));
      if (watchData.bonusClaimable) {
        toast.success(`Bonus débloqué ! Récupère tes ${watchData.bonusClaimable.reward} BP sur le dashboard.`);
        setTimeout(() => router.push("/dashboard"), 1500);
      }

      // Background video scrape (Instagram only — TikTok/YouTube videos to come)
      if (platform === "instagram") {
        fetch(`/api/creators/${scrapeData.creator.id}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 30 }),
        }).catch(() => {});
      }

      setScrape(platform, {
        status: "done",
        result: { name: scrapeData.creator.name, followers: scrapeData.creator.followers },
      });
      // Refresh networks dashboard
      reloadProfile();
    } catch {
      setScrape(platform, { status: "error", error: "Erreur réseau, réessaie." });
    }
  }, [setScrape, reloadProfile, toast, router]);

  const plan = profileData?.plan ?? ctxProfile?.plan ?? "creator";
  const planLabel = { creator: "Creator", growth: "Growth", scale: "Scale" }[plan] ?? plan;

  // Prefer Instagram data for profile header
  const igNetwork = networks.find(n => n.platform === "instagram");
  const avatarUrl = igNetwork?.avatar_url || profileData?.avatar_url || ctxProfile?.avatar_url;
  const fullName = igNetwork?.name || profileData?.full_name || ctxProfile?.full_name || "";
  const email = profileData?.email || ctxProfile?.email || "";
  const initials = fullName.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || email[0]?.toUpperCase() || "?";
  const displayName = fullName || email.split("@")[0] || "Utilisateur";
  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  if (loading) return <Loading variant="page" size="md" className="py-16" />;

  return (
    <motion.div key="profil" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-4xl mx-auto">

      {/* Unified Profile Hub Card */}
      <ProfileHubCard
        avatarUrl={avatarUrl}
        initials={initials}
        displayName={displayName}
        planLabel={planLabel}
        memberSince={memberSince}
        stats={stats}
        networks={networks}
        igNetwork={igNetwork ?? null}
      />

      {/* Informations */}
      <div className="rounded-2xl border-2 border-brutify-gold/10 bg-[#111113] p-6 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]">
        <h3 className="font-display text-xs uppercase tracking-widest text-brutify-text-muted/60 mb-2">Informations</h3>
        <InlineField label="Nom complet" icon={<User />} value={fullName} placeholder="Ton prénom et nom" onSave={v => updateField("full_name", v)} />
        <InlineField label="Email" icon={<Mail />} value={email} placeholder="—" onSave={async () => {}} readOnly />
      </div>

      {/* Mes réseaux — champs handles */}
      <div className="rounded-2xl border-2 border-brutify-gold/10 bg-[#111113] p-6 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4 text-brutify-gold" />
          <h3 className="font-display text-xs uppercase tracking-widest text-brutify-text-muted/60">Lier mes réseaux</h3>
        </div>
        <p className="text-[11px] font-body text-brutify-text-muted/50 -mt-2">Renseigne tes handles pour que Brutify analyse tes propres stats</p>

        {/* Instagram */}
        <SocialHandleField
          icon={<Instagram className="h-4 w-4" />}
          label="Instagram"
          accentColor="#E1306C"
          value={profileData?.instagram_handle ?? ""}
          placeholder="ton.handle"
          profileUrl={profileData?.instagram_handle ? `https://instagram.com/${profileData.instagram_handle}` : null}
          onSave={v => updateField("instagram_handle", v)}
          onAfterSave={v => { if (v) scrapeAndAdd("instagram", v); }}
          onUnlink={() => { setScrape("instagram", { status: "idle", result: null, error: null }); setTimeout(reloadProfile, 300); }}
        />
        <ScrapeStatusBlock state={scrapeStates.instagram} platform="instagram" />

        {/* TikTok */}
        <SocialHandleField
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z" />
            </svg>
          }
          label="TikTok"
          accentColor="#69C9D0"
          value={profileData?.tiktok_handle ?? ""}
          placeholder="ton.handle"
          profileUrl={profileData?.tiktok_handle ? `https://tiktok.com/@${profileData.tiktok_handle}` : null}
          onSave={v => updateField("tiktok_handle", v)}
          onAfterSave={v => { if (v) scrapeAndAdd("tiktok", v); }}
          onUnlink={() => { setScrape("tiktok", { status: "idle", result: null, error: null }); setTimeout(reloadProfile, 300); }}
        />
        <ScrapeStatusBlock state={scrapeStates.tiktok} platform="tiktok" />

        {/* YouTube */}
        <SocialHandleField
          icon={<Youtube className="h-4 w-4" />}
          label="YouTube"
          accentColor="#FF0000"
          value={profileData?.youtube_handle ?? ""}
          placeholder="@TaChaine"
          profileUrl={profileData?.youtube_handle ? `https://youtube.com/@${profileData.youtube_handle}` : null}
          onSave={v => updateField("youtube_handle", v)}
          onAfterSave={v => { if (v) scrapeAndAdd("youtube", v); }}
          onUnlink={() => { setScrape("youtube", { status: "idle", result: null, error: null }); setTimeout(reloadProfile, 300); }}
        />
        <ScrapeStatusBlock state={scrapeStates.youtube} platform="youtube" />
      </div>

      {/* Préférences IA */}
      <div className="rounded-2xl border-2 border-brutify-gold/10 bg-[#111113] p-6 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-brutify-gold" />
          <h3 className="font-display text-xs uppercase tracking-widest text-brutify-text-muted/60">Préférences IA</h3>
        </div>
        <p className="text-[11px] font-body text-brutify-text-muted/50 -mt-2">Ces infos personnalisent la génération de scripts</p>
        <InlineField label="Niche" icon={<Target />} value={profileData?.niche ?? ""} placeholder="ex : Business en ligne, Fitness..." onSave={v => updateField("niche", v)} />
        <InlineField label="Ton de voix" icon={<Mic />} value={profileData?.tone_of_voice ?? ""} placeholder="ex : Direct, inspirant, éducatif..." onSave={v => updateField("tone_of_voice", v)} />
        <InlineField label="Style d'écriture" icon={<PenTool />} value={profileData?.writing_style ?? ""} placeholder="ex : Court et percutant, storytelling..." onSave={v => updateField("writing_style", v)} />
      </div>
    </motion.div>
  );
}

// ── Profile Hub Card ───────────────────────────────────────────────────────

function ProfileHubCard({
  avatarUrl, initials, displayName, planLabel, memberSince,
  stats, networks, igNetwork,
}: {
  avatarUrl?: string | null;
  initials: string;
  displayName: string;
  planLabel: string;
  memberSince: string;
  stats: ProfileStats;
  networks: NetworkStats[];
  igNetwork: NetworkStats | null;
}) {
  const [activeNet, setActiveNet] = useState<string>("all");

  const selectedNet = activeNet === "all" ? null : networks.find(n => n.platform === activeNet) ?? null;

  const agg = {
    followers:      networks.reduce((s, n) => s + n.followers, 0),
    total_views:    networks.reduce((s, n) => s + n.total_views, 0),
    total_likes:    networks.reduce((s, n) => s + n.total_likes, 0),
    posts_count:    networks.reduce((s, n) => s + n.posts_count, 0),
    avg_views:      networks.length ? Math.round(networks.reduce((s, n) => s + n.avg_views, 0) / networks.length) : 0,
    engagement_rate: networks.length ? Math.round(networks.reduce((s, n) => s + n.engagement_rate, 0) / networks.length * 100) / 100 : 0,
    growth_rate:    networks.length ? Math.round(networks.reduce((s, n) => s + n.growth_rate, 0) / networks.length * 100) / 100 : 0,
  };

  const netDisplay = selectedNet ? {
    followers:      selectedNet.followers,
    total_views:    selectedNet.total_views,
    total_likes:    selectedNet.total_likes,
    posts_count:    selectedNet.posts_count,
    avg_views:      selectedNet.avg_views,
    engagement_rate: selectedNet.engagement_rate,
    growth_rate:    selectedNet.growth_rate,
  } : agg;

  const accentColor = activeNet !== "all" ? (PLATFORM_META[activeNet]?.color ?? "#FFAB00") : "#FFAB00";

  const brutifyMetrics = [
    { icon: <Users className="h-4 w-4" />, label: "Créateurs",        value: String(stats.creators) },
    { icon: <Video className="h-4 w-4" />, label: "Vidéos analysées", value: String(stats.videos) },
    { icon: <FileText className="h-4 w-4" />, label: "Scripts",       value: String(stats.scripts) },
  ];

  const netMetrics = [
    { icon: <Users className="h-4 w-4" />,    label: "Abonnés",    value: fmt(netDisplay.followers) },
    { icon: <Video className="h-4 w-4" />,    label: "Vues moy.",  value: fmt(netDisplay.avg_views) },
    { icon: <Zap className="h-4 w-4" />,      label: "Engagement", value: `${netDisplay.engagement_rate.toFixed(1)}%` },
    { icon: <FileText className="h-4 w-4" />, label: "Contenus",   value: fmt(netDisplay.posts_count) },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden">

      {/* ── Banner ── */}
      <div className="relative h-36 overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxyImg(avatarUrl)} alt=""
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60 pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brutify-gold/30 via-purple-800/20 to-[#111113]" />
        )}
        {/* Dark vignette so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        {/* Subtle top border */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── Identity ── */}
      <div className="relative px-6 pb-5">
        {/* Avatar — overlaps banner */}
        <div className="flex items-end gap-5 -mt-11">
            <div className="relative shrink-0 z-10">
            <div
              className="h-[90px] w-[90px] rounded-full overflow-hidden"
              style={{
                border: "4px solid rgba(255,171,0,0.3)",
                boxShadow: "0 0 0 3px #111113, 0 0 0 5px rgba(255,171,0,0.2), 0 0 40px rgba(255,171,0,0.35), 0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              <SocialAvatar src={avatarUrl} initials={initials} size={90} />
            </div>
            {/* Platform badge — or monochrome style Brutify */}
            {igNetwork && (
              <div
                className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full flex items-center justify-center border-2 border-[#111113] bg-brutify-gold/20 text-brutify-gold shadow-[0_0_12px_rgba(255,171,0,0.25)]"
                title="Instagram"
              >
                <Instagram className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Push plan badge to the right while avatar loads in */}
          <div className="flex-1" />
          <div className="pb-1 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-brutify-gold/40 bg-brutify-gold/[0.15] px-3 py-1.5 text-[11px] font-body font-bold text-brutify-gold shadow-[0_0_24px_rgba(255,171,0,0.25)]">
              <Crown className="h-3 w-3" />{planLabel}
            </span>
          </div>
        </div>

        {/* Name row */}
        <div className="mt-3">
          <h2 className="font-display text-2xl tracking-wide text-white leading-tight truncate">
            {displayName}
          </h2>
          <p className="text-[12px] font-body text-white/40 mt-1">
            Membre depuis {memberSince}
          </p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px mx-6 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ── Brutify Activity ── */}
      <div className="px-6 pt-4 pb-3">
        <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-brutify-gold/50 mb-3">
          Activité Brutify
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {brutifyMetrics.map(m => (
            <div key={m.label}
              className="rounded-xl border-2 border-brutify-gold/15 bg-brutify-gold/[0.05] p-3 text-center group hover:border-brutify-gold/30 hover:bg-brutify-gold/[0.08] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,171,0,0.15)] transition-all duration-300"
            >
              <div className="flex justify-center text-brutify-gold/40 mb-1.5 group-hover:text-brutify-gold/60 transition-colors">{m.icon}</div>
              <p className="font-display text-2xl text-brutify-text-primary leading-none">{m.value}</p>
              <p className="text-[9px] font-body text-brutify-text-muted/40 mt-1 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Networks stats ── */}
      {networks.length > 0 && (
        <>
          <div className="h-px mx-6 mt-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="px-6 pt-4 pb-5">
            {/* Header + platform selector */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest" style={{ color: `${accentColor}80` }}>
                Mes réseaux
              </p>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <button
                  onClick={() => setActiveNet("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[10px] font-body font-semibold transition-all",
                    activeNet === "all" ? "bg-brutify-gold/10 text-brutify-gold border border-brutify-gold/20" : "text-brutify-text-muted/60 hover:text-brutify-text-muted"
                  )}
                >Tous</button>
                {networks.map(n => {
                  const meta = PLATFORM_META[n.platform];
                  if (!meta) return null;
                  const isActive = activeNet === n.platform;
                  return (
                    <button key={n.platform} onClick={() => setActiveNet(n.platform)}
                      className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-body font-semibold transition-all border",
                        isActive ? "border" : "border-transparent text-brutify-text-muted/60 hover:text-brutify-text-muted"
                      )}
                      style={isActive ? { background: meta.bg, color: meta.color, borderColor: meta.border } : undefined}
                    >
                      <span style={{ color: isActive ? meta.color : undefined }}>{meta.icon}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics grid */}
            <AnimatePresence mode="wait">
              <motion.div key={activeNet} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {netMetrics.map(m => (
                  <div key={m.label}
                    className="rounded-xl border p-3 text-center transition-all"
                    style={{ borderColor: `${accentColor}20`, background: `${accentColor}06` }}
                  >
                    <div className="flex justify-center mb-1.5" style={{ color: `${accentColor}60` }}>{m.icon}</div>
                    <p className="font-display text-xl leading-none" style={{ color: accentColor }}>{m.value}</p>
                    <p className="text-[9px] font-body text-brutify-text-muted/40 mt-1">{m.label}</p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Per-platform breakdown bar (only when "Tous" + multiple networks) */}
            {activeNet === "all" && networks.length > 1 && (
              <div className="mt-4 space-y-2">
                {networks.map(n => {
                  const meta = PLATFORM_META[n.platform];
                  if (!meta) return null;
                  const pct = agg.followers > 0 ? Math.round((n.followers / agg.followers) * 100) : 0;
                  return (
                    <div key={n.platform} className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 w-20 shrink-0">
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="text-[10px] font-body text-brutify-text-muted/60">{meta.label}</span>
                      </div>
                      <div className="flex-1 h-1 rounded-full bg-white/[0.04]">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                        />
                      </div>
                      <span className="text-[10px] font-body font-semibold text-brutify-text-muted/70 w-10 text-right">{fmt(n.followers)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Networks Dashboard ─────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  instagram: {
    label: "Instagram", color: "#E1306C", bg: "#E1306C15", border: "#E1306C30",
    icon: <Instagram className="h-3.5 w-3.5" />,
  },
  tiktok: {
    label: "TikTok", color: "#69C9D0", bg: "#69C9D015", border: "#69C9D030",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube", color: "#FF0000", bg: "#FF000015", border: "#FF000030",
    icon: <Youtube className="h-3.5 w-3.5" />,
  },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function planOrder(plan: PlanKey): number {
  const order: Record<PlanKey, number> = { creator: 1, growth: 2, scale: 3 };
  return order[plan];
}

function CostCard({
  icon,
  label,
  cost,
}: {
  icon: React.ReactNode;
  label: string;
  cost: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brutify-gold/20 bg-[#111113]/60 p-3 text-center transition-all duration-300 hover:border-brutify-gold/40 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_0_32px_rgba(255,171,0,0.2)] shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-center text-brutify-gold mb-1.5">
        {icon}
      </div>
      <p className="text-[11px] font-body text-brutify-text-secondary mb-0.5">
        {label}
      </p>
      <p className="text-xs font-body font-semibold text-brutify-gold">
        {cost}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loading variant="page" size="lg" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}

