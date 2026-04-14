"use client";

import { useState, Suspense } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { CreditsProvider } from "@/lib/credits-context";

import { CreditsToastWrapper } from "@/components/notifications/CreditsToastWrapper";
import { UpsellProvider } from "@/components/upsell/UpsellProvider";
import { AutoUpsellChecker } from "@/components/upsell/AutoUpsellChecker";

function SidebarFallback() {
  return (
    <div className="fixed left-0 top-0 z-40 h-full w-[260px] border-r border-white/[0.06] bg-brutify-bg/95 backdrop-blur-xl hidden md:block" />
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <CreditsProvider>
      <UpsellProvider>
        <AuroraBackground />
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </Suspense>
        <div className="md:pl-[260px] min-h-screen relative z-10">
          {/* Mobile-only header — hamburger + logo */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-brutify-bg/60 backdrop-blur-xl px-4 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] transition-all hover:bg-white/[0.04] cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5 text-brutify-text-secondary" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-brutify-gold to-brutify-gold-dark shadow-[0_0_12px_rgba(255,171,0,0.2)]">
                <Sparkles className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="font-display text-base tracking-[0.15em] text-gold-gradient">BRUTIFY</span>
            </div>
            <div className="w-9" /> {/* spacer */}
          </header>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
        {/* Checks upsell automatiques (credits_50%, power_user) */}
        <AutoUpsellChecker />
        {/* Toast notifications pour alertes critiques en temps reel */}
        <CreditsToastWrapper />
      </UpsellProvider>
    </CreditsProvider>
  );
}
