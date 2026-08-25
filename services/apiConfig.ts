// Base URL of the YOMICO web app's deployed API (Visupiyu/yogi, Next.js on
// Vercel) — the mobile app's server-authoritative order-creation endpoint
// lives there (app/api/mobile/place-order), since Firestore rules deny
// client-side order creation for every platform (orders' `allow create: if
// false`).
export const API_BASE_URL = "https://www.yomico.in";

// One idempotency key per Checkout visit — CheckoutScreen generates this
// once on mount (a fresh visit always gets a fresh key; a retry within the
// same visit, including a fast double-tap that slips past the loading
// guard, reuses it), matching app/api/mobile/place-order's
// IDEMPOTENCY_KEY_PATTERN (^[A-Za-z0-9_-]{8,64}$).
export function generateIdempotencyKey(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}
