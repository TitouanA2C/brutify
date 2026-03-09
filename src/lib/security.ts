/**
 * Helpers de sécurité partagés (SSRF, redirect, validation).
 * Utilisés par les routes API uniquement (côté serveur).
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Vérifie qu'une chaîne est un UUID v4 valide.
 */
export function isValidUuid(s: string | undefined | null): boolean {
  if (typeof s !== "string" || s.length !== 36) return false
  return UUID_REGEX.test(s)
}

/**
 * Allowlist SSRF stricte : le hostname doit être exactement le domaine
 * ou un sous-domaine (ex. cdn.instagram.com pour instagram.com).
 * N'autorise pas evil-instagram.com (includes serait vrai).
 * Exige HTTPS en production.
 */
export function isAllowedProxyHostname(
  url: string,
  allowedDomains: string[],
  requireHttps = true
): boolean {
  try {
    const parsed = new URL(url)
    if (requireHttps && parsed.protocol !== "https:") return false
    const host = parsed.hostname.toLowerCase()
    return allowedDomains.some((domain) => {
      const d = domain.toLowerCase()
      return host === d || host.endsWith("." + d)
    })
  } catch {
    return false
  }
}

/**
 * Valide que `next` est un chemin de redirection sûr (pas d'open redirect).
 * Autorise uniquement un chemin relatif commençant par /, sans // ni \.
 */
export function isSafeRedirectPath(next: string): boolean {
  if (typeof next !== "string") return false
  const trimmed = next.trim()
  if (trimmed === "" || trimmed[0] !== "/") return false
  if (trimmed.includes("//") || trimmed.includes("\\")) return false
  return true
}

/**
 * Sanitize une chaîne pour une recherche ILIKE Supabase :
 * limite la longueur et échappe les wildcards % et _ pour éviter l'injection de pattern.
 */
/**
 * Échappe % et _ pour une utilisation sûre dans ILIKE (wildcards Postgres).
 * Limite la longueur pour éviter les abus.
 */
export function sanitizeSearchQuery(q: string, maxLength = 100): string {
  const s = String(q).trim().slice(0, maxLength)
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}
