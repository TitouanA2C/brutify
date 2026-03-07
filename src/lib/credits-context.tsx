"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { ACTION_LABELS } from "@/lib/credits-constants";
import { FREE_TRANSCRIPTS_LIMITS } from "@/lib/credits-rules";

export interface CreditUsage {
  id: string;
  action: string;
  actionLabel: string;
  cost: number;
  date: string;
  referenceId?: string | null;
}

interface CreditsContextType {
  credits: number;
  maxCredits: number;
  plan: string;
  borrowedCredits: number;
  rolloverCredits: number;
  freeTranscriptsUsed: number;
  freeTranscriptsLimit: number;
  spend: (cost: number) => void;
  canAfford: (cost: number) => boolean;
  history: CreditUsage[];
  historyLoading: boolean;
  addUsage: (action: string, cost: number) => void;
  refreshCredits: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

const MAX_CREDITS_BY_PLAN: Record<string, number> = {
  creator: 500,
  growth: 2000,
  scale: 6000,
};

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function dbRowToUsage(row: {
  id: string;
  action: string;
  amount: number;
  created_at: string;
  reference_id?: string | null;
}): CreditUsage {
  return {
    id: row.id,
    action: row.action,
    actionLabel: ACTION_LABELS[row.action] ?? row.action,
    cost: Math.abs(row.amount),
    date: formatDate(row.created_at),
    referenceId: row.reference_id ?? null,
  };
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useUser();
  const [localCredits, setLocalCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditUsage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const credits = localCredits ?? profile?.credits ?? 0;
  const plan = profile?.plan ?? "creator";
  const maxCredits = MAX_CREDITS_BY_PLAN[plan] ?? 500;
  const borrowedCredits = profile?.borrowed_credits ?? 0;
  const rolloverCredits = profile?.rollover_credits ?? 0;
  const freeTranscriptsUsed = profile?.free_transcripts_used ?? 0;
  const freeTranscriptsLimit = FREE_TRANSCRIPTS_LIMITS[plan] ?? 0;

  // Sync credits from profile
  useEffect(() => {
    if (profile) {
      setLocalCredits(profile.credits);
    }
  }, [profile]);

  // Charger l'historique depuis credit_transactions au montage
  const loadHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("credit_transactions")
        .select("id, action, amount, created_at, reference_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setHistory(data.map(dbRowToUsage));
      }
    } catch {
      /* silently fail — historique non critique */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadHistory(profile.id);
    }
  }, [profile?.id, loadHistory]);

  const spend = useCallback((cost: number) => {
    setLocalCredits((prev) => Math.max(0, (prev ?? 0) - cost));
  }, []);

  const canAfford = useCallback(
    (cost: number) => credits >= cost,
    [credits]
  );

  // Optimistic update — sera écrasé au prochain refreshHistory
  const addUsage = useCallback(
    (action: string, cost: number) => {
      const entry: CreditUsage = {
        id: `opt-${Date.now()}`,
        action,
        actionLabel: ACTION_LABELS[action] ?? action,
        cost,
        date: "À l'instant",
      };
      setHistory((prev) => [entry, ...prev]);
      setLocalCredits((prev) => Math.max(0, (prev ?? 0) - cost));
    },
    []
  );

  const refreshCredits = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  const refreshHistory = useCallback(async () => {
    if (profile?.id) {
      await loadHistory(profile.id);
    }
  }, [profile?.id, loadHistory]);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        maxCredits,
        plan,
        borrowedCredits,
        rolloverCredits,
        freeTranscriptsUsed,
        freeTranscriptsLimit,
        spend,
        canAfford,
        history,
        historyLoading,
        addUsage,
        refreshCredits,
        refreshHistory,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
}
