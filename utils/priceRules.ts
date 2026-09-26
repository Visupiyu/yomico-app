// Customer-facing pricing rules — the same rules the YOMICO server charges by.
// Dependency-free, so screens, services and the standalone test can all use it.
//
// positiveNumber / productBasePrice / payableTotal are exact copies of the
// website's lib/pricing/priceRules.ts, and effectiveVariantPrice is an exact
// copy of the website's lib/products/variantSelection.ts#effectiveVariantPrice.
// scripts/test-pricing.mts fails if any of them drifts from the website.
//
// - Base price: sellingPrice when > 0, else the legacy `price` field, else 0.
// - A variant's own price (> 0) wins over the base price.
// - Prices are GST-INCLUSIVE: GST is never added on top of them.
// - The payable total is rounded to the whole rupee, minimum ₹1.
// The server re-prices every order itself; these rules only make what the
// app shows match what the server will charge.

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** The product's base unit price: sellingPrice, else legacy price, else 0. */
export function productBasePrice(
  product: { sellingPrice?: unknown; price?: unknown } | null | undefined
): number {
  return positiveNumber(product?.sellingPrice) ?? positiveNumber(product?.price) ?? 0;
}

/** The customer-payable amount for a raw total: whole rupees, minimum ₹1. */
export function payableTotal(rawTotal: number): number {
  return Math.max(1, Math.round(rawTotal));
}

export function effectiveVariantPrice(
  basePrice: number,
  variant: unknown
): number {
  const variantPrice =
    variant && typeof variant === "object"
      ? Number((variant as { price?: unknown }).price)
      : NaN;
  return Number.isFinite(variantPrice) && variantPrice > 0 ? variantPrice : basePrice;
}

/**
 * The unit price the server charges for one cart line: the chosen variant's
 * own price when it has one, otherwise the product's base price. The variant
 * is looked up by the id stored on the cart line, as the server does.
 */
export function cartLineUnitPrice(
  product: { sellingPrice?: unknown; price?: unknown; variants?: unknown } | null | undefined,
  variantId?: string | null
): number {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const variant = variantId
    ? variants.find((v: unknown) => !!v && typeof v === "object" && (v as { id?: unknown }).id === variantId) ?? null
    : null;
  return effectiveVariantPrice(productBasePrice(product), variant);
}
