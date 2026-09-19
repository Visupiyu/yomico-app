// Address-string -> external Google Maps SEARCH URL. Navigation ONLY: it
// hands off to the device's default maps handling (browser or installed
// Maps app) via Linking.openURL — NOT tracking, NOT live location, NOT a
// Maps SDK/geocoding call, and stores no coordinates. Mirrors the web
// codebase's lib/maps.ts exactly (separate repo, no shared package).
//
// Returns null for an empty/blank address so callers render NO link rather
// than a maps query for nothing (never guesses a destination that does not
// exist).
export function mapsSearchUrl(address: string | null | undefined): string | null {
  const q = (address ?? "").trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
