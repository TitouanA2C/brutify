"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * La Banque d'idées a été supprimée : les idées (dont l'Inspiration IA)
 * arrivent uniquement dans le BrutBoard à l'état "idée".
 * Redirection vers le BrutBoard.
 */
export default function VaultPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/board");
  }, [router]);
  return null;
}
