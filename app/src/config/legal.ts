/**
 * Zentrale Quelle für alle Rechts-Links.
 * Liegt bei den Legal-Seiten im web-checkout (Next.js auf Vercel).
 * Sobald setiq.net registriert + als Vercel-Alias hinterlegt ist, hier auf
 * `https://setiq.net` umstellen – kein weiterer Code-Touch nötig.
 */
export const LEGAL_BASE_URL = 'https://web-checkout-sicci-s-projects.vercel.app';

export const LEGAL_URLS = {
  agb: `${LEGAL_BASE_URL}/agb`,
  datenschutz: `${LEGAL_BASE_URL}/datenschutz`,
  impressum: `${LEGAL_BASE_URL}/impressum`,
} as const;

export const SUPPORT_EMAIL = 'setiq.marketplace@gmail.com';
