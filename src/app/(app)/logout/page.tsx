"use client";

import { useEffect } from "react";

/**
 * Redirection immédiate vers l’API de déconnexion (efface les cookies côté serveur puis /login).
 * Les liens "Se déconnecter" pointent directement vers /api/auth/logout pour éviter latence et flash.
 */
export default function LogoutPage() {
  useEffect(() => {
    window.location.href = "/api/auth/logout";
  }, []);

  return null;
}
