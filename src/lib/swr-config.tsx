"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

const globalFetcher = async (url: string) => {
  const res = await fetch(url);

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Non autorisé");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error ?? `Erreur ${res.status}`) as Error & {
      status: number;
      info: Record<string, unknown>;
    };
    error.status = res.status;
    error.info = data;
    throw error;
  }

  return res.json();
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: globalFetcher,
        errorRetryCount: 1,
        shouldRetryOnError: (err: unknown) => {
          const status = (err as { status?: number })?.status;
          return status !== undefined && status >= 500;
        },
        revalidateOnFocus: false,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
