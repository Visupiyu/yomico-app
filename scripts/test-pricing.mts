// @ts-nocheck — a Node script: the app's tsconfig type-checks every file but
// the project has no @types/node, so node:* imports can't be typed here.
//
// Customer App pricing tests — no test framework, no extra dependencies.
//
//   node scripts/test-pricing.mts
//
// 1. utils/priceRules.ts: base price, variant price, GST-inclusive totals and
//    payable-total rounding behave exactly like the live server.
// 2. The app's checkout amount equals the server's for the same cart/coupon,
//    computed with the website's own modules.
// 3. productBasePrice / payableTotal / effectiveVariantPrice are exact copies
//    of the website's (read from ../yogi-mart-next or YOMICO_WEB_REPO). If the
//    website can't be found the test FAILS rather than skipping.
// 4. Source checks: no price-before-sellingPrice, no GST added on top, the
//    grand total uses payableTotal, and both order requests still send only
//    the coupon code.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = process.env.YOMICO_WEB_REPO || resolve(ROOT, "..", "yogi-mart-next");
const APP_RULES = join(ROOT, "utils", "priceRules.ts");
const WEB_RULES = join(WEB, "lib", "pricing", "priceRules.ts");
const WEB_VARIANTS = join(WEB, "lib", "products", "variantSelection.ts");
const WEB_COUPONS = join(WEB, "lib", "coupons", "couponRules.ts");

const app = await import(pathToFileURL(APP_RULES).href);
const { evaluateCoupon } = await import(pathToFileURL(join(ROOT, "utils", "couponRules.ts")).href);
const { productBasePrice, payableTotal, effectiveVariantPrice, cartLineUnitPrice } = app;

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${(error as Error).message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, label = "") {
  assert(actual === expected, `${label} expected ${expected}, got ${actual}`);
}

const read = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// ---- The app's checkout calculation (screens/CheckoutScreen.tsx) ----
// subtotal = Σ line price × qty (line price from getCartItems' live re-price),
// GST = 0 (GST-inclusive), shipping by the threshold rule, coupon from the
// shared evaluator, grand total = payableTotal(subtotal + shipping + gst - discount).
const SHIPPING = { freeShippingThreshold: 499, standardShippingCharge: 49 };
type Line = { product: Record<string, unknown>; qty: number; variantId?: string };

function appCheckout(lines: Line[], coupon: Record<string, unknown> | null = null) {
  const subtotal = lines.reduce((sum, l) => sum + cartLineUnitPrice(l.product, l.variantId) * l.qty, 0);
  const gstAmount = 0;
  const shipping = subtotal >= SHIPPING.freeShippingThreshold ? 0 : SHIPPING.standardShippingCharge;
  const evaluated = coupon ? evaluateCoupon(coupon, subtotal) : null;
  const discount = evaluated && evaluated.ok ? evaluated.discountAmount : 0;
  return { subtotal, gstAmount, shipping, discount, payable: payableTotal(subtotal + shipping + gstAmount - discount) };
}

const COUPON_10 = { code: "SAVE10", discount: 10, active: true };

console.log("\nA. Base price");
check("1. price=500, sellingPrice=450 -> 450", () => eq(productBasePrice({ price: 500, sellingPrice: 450 }), 450));
check("2. only price=350 -> 350", () => eq(productBasePrice({ price: 350 }), 350));
check("3. sellingPrice=0, price=350 -> 350", () => eq(productBasePrice({ sellingPrice: 0, price: 350 }), 350));
check("4. invalid sellingPrice (negative / string / NaN / Infinity) + valid price -> price", () => {
  for (const sellingPrice of [-5, "450", NaN, Infinity, null]) {
    eq(productBasePrice({ sellingPrice, price: 350 }), 350, `sellingPrice=${String(sellingPrice)}`);
  }
});
check("4b. neither usable -> 0 (same fallback as the server)", () => {
  eq(productBasePrice({}), 0);
  eq(productBasePrice(null), 0);
});

console.log("\nB. Variants");
const VARIANT_PRODUCT = {
  price: 500, sellingPrice: 450,
  variants: [
    { id: "v_own", attributes: { Size: "L" }, stock: 5, price: 700 },
    { id: "v_zero", attributes: { Size: "M" }, stock: 5, price: 0 },
    { id: "v_none", attributes: { Size: "S" }, stock: 5 },
  ],
};
check("5. variant with own price 700 -> 700", () => eq(cartLineUnitPrice(VARIANT_PRODUCT, "v_own"), 700));
check("6. variant price 0 / missing -> productBasePrice fallback 450 (not legacy 500)", () => {
  eq(cartLineUnitPrice(VARIANT_PRODUCT, "v_zero"), 450, "v_zero");
  eq(cartLineUnitPrice(VARIANT_PRODUCT, "v_none"), 450, "v_none");
});
check("6b. no variantId / unknown variantId -> base price", () => {
  eq(cartLineUnitPrice(VARIANT_PRODUCT, undefined), 450, "none");
  eq(cartLineUnitPrice(VARIANT_PRODUCT, "v_gone"), 450, "unknown");
  eq(effectiveVariantPrice(450, null), 450, "null variant");
});

console.log("\nC. GST-inclusive");
check("7. ₹1000 with gstPercent=18 -> customer total ₹1000", () => {
  const r = appCheckout([{ product: { sellingPrice: 1000, gstPercent: 18 }, qty: 1 }]);
  eq(r.gstAmount, 0, "gstAmount");
  eq(r.payable, 1000, "payable");
});
check("8. ₹1000 with gstRate=18 -> customer total ₹1000", () =>
  eq(appCheckout([{ product: { sellingPrice: 1000, gstRate: 18 }, qty: 1 }]).payable, 1000));
check("9. no GST fields -> no extra GST", () =>
  eq(appCheckout([{ product: { sellingPrice: 1000 }, qty: 1 }]).payable, 1000));

console.log("\nD. Rounding");
check("10. raw 2000 -> 2000", () => eq(payableTotal(2000), 2000));
check("11. raw 899.10 -> 899", () => eq(payableTotal(899.1), 899));
check("12. raw 899.50 -> 900", () => eq(payableTotal(899.5), 900));
check("13. raw 0 -> 1", () => eq(payableTotal(0), 1));

console.log("\nE. Coupon integration");
check("14. ₹999 with 10% coupon -> discount 99.90, displayed payable ₹899", () => {
  const r = appCheckout([{ product: { sellingPrice: 999 }, qty: 1 }], COUPON_10);
  assert(Math.abs(r.discount - 99.9) < 1e-9, `discount ${r.discount}`);
  eq(r.payable, 899, "payable");
});

const checkout = read(join(ROOT, "screens", "CheckoutScreen.tsx"));
function requestBody(endpoint: string): string {
  const at = checkout.indexOf(`/api/mobile/${endpoint}\``);
  assert(at !== -1, `fetch to /api/mobile/${endpoint} not found`);
  const start = checkout.indexOf("JSON.stringify({", at);
  const end = checkout.indexOf("})", start);
  assert(start !== -1 && end !== -1, `request body for ${endpoint} not found`);
  return checkout.slice(start, end);
}
check("15. COD and ONLINE requests still send only couponCode (no discount / amount / total / price / gst)", () => {
  for (const endpoint of ["place-order", "create-payment-order"]) {
    const body = requestBody(endpoint);
    assert(/couponCode:\s*appliedCoupon\?\.code \|\| null/.test(body), `${endpoint}: couponCode field missing`);
    assert(!/discount|amount|total|subtotal|price|gst/i.test(body), `${endpoint}: unexpected pricing field:\n${body}`);
  }
});

console.log("\nF. Parity with the website/server rules");
const webExists = existsSync(WEB_RULES) && existsSync(WEB_VARIANTS) && existsSync(WEB_COUPONS);
check("16. website pricing modules available for the parity comparison", () => {
  assert(webExists, `website not found at ${WEB} — set YOMICO_WEB_REPO`);
  return undefined;
});
if (webExists) {
  const web = await import(pathToFileURL(WEB_RULES).href);
  const webCoupons = await import(pathToFileURL(WEB_COUPONS).href);
  // The server: productBasePrice -> effectiveVariantPrice -> subtotal; no GST;
  // shipping by threshold; coupon on the subtotal; payableTotal.
  const serverVariant = (base: number, variant: any) => {
    const vp = variant && typeof variant === "object" ? Number(variant.price) : NaN;
    return Number.isFinite(vp) && vp > 0 ? vp : base;
  };
  const server = (lines: Line[], coupon: Record<string, unknown> | null) => {
    const subtotal = lines.reduce((sum, l) => {
      const variants = Array.isArray(l.product.variants) ? l.product.variants : [];
      const variant = l.variantId ? variants.find((v: any) => v.id === l.variantId) || null : null;
      return sum + serverVariant(web.productBasePrice(l.product), variant) * l.qty;
    }, 0);
    const shipping = subtotal >= SHIPPING.freeShippingThreshold ? 0 : SHIPPING.standardShippingCharge;
    const ev = coupon ? webCoupons.evaluateCoupon(coupon, subtotal) : null;
    return web.payableTotal(subtotal + shipping - (ev && ev.ok ? ev.discountAmount : 0));
  };
  const scenarios: [string, Line[], Record<string, unknown> | null][] = [
    ["both fields x1", [{ product: { price: 500, sellingPrice: 450 }, qty: 1 }], null],
    ["stale price x3 + 10%", [{ product: { price: 500, sellingPrice: 450 }, qty: 3 }], COUPON_10],
    ["999 + 10%", [{ product: { sellingPrice: 999 }, qty: 1 }], COUPON_10],
    ["995 + 10% (half rupee)", [{ product: { sellingPrice: 995 }, qty: 1 }], COUPON_10],
    ["333 + 10% + shipping", [{ product: { sellingPrice: 333 }, qty: 1 }], COUPON_10],
    ["gstPercent 18 + 10%", [{ product: { sellingPrice: 1000, gstPercent: 18 }, qty: 1 }], COUPON_10],
    ["variant own price x2", [{ product: VARIANT_PRODUCT, qty: 2, variantId: "v_own" }], null],
    ["variant fallback x2 + 10%", [{ product: VARIANT_PRODUCT, qty: 2, variantId: "v_zero" }], COUPON_10],
    ["mixed cart", [
      { product: { sellingPrice: 999 }, qty: 1 },
      { product: VARIANT_PRODUCT, qty: 1, variantId: "v_own" },
      { product: { price: 350 }, qty: 2 },
    ], COUPON_10],
  ];
  for (const [label, lines, coupon] of scenarios) {
    check(`16. ${label}: app ${appCheckout(lines, coupon).payable} == server ${server(lines, coupon)}`, () =>
      eq(appCheckout(lines, coupon).payable, server(lines, coupon)));
  }
}

console.log("\nG. Copy consistency (website pricing functions)");
function functionBlock(source: string, signature: string, file: string): string {
  const start = source.indexOf(signature);
  assert(start !== -1, `${signature} not found in ${file}`);
  const end = source.indexOf("\n}\n", start);
  assert(end !== -1, `end of ${signature} not found in ${file}`);
  return source.slice(start, end + 2);
}
check("17. positiveNumber / productBasePrice / payableTotal / effectiveVariantPrice identical to the website", () => {
  assert(webExists, `website not found at ${WEB} — set YOMICO_WEB_REPO to the website checkout`);
  const appSource = read(APP_RULES);
  const webRules = read(WEB_RULES);
  const webVariants = read(WEB_VARIANTS);
  const pairs: [string, string, string][] = [
    ["function positiveNumber(", webRules, WEB_RULES],
    ["export function productBasePrice(", webRules, WEB_RULES],
    ["export function payableTotal(", webRules, WEB_RULES],
    ["export function effectiveVariantPrice(", webVariants, WEB_VARIANTS],
  ];
  for (const [signature, webSource, file] of pairs) {
    const expected = functionBlock(webSource, signature, file);
    const actual = functionBlock(appSource, signature, APP_RULES);
    assert(actual === expected, `${signature.trim()} differs from ${file} — re-copy it`);
  }
});

console.log("\nH. Product Details displayed price");
// ProductDetailsScreen: selectedVariant = resolveVariant(product.variants, selection);
// displayPrice = cartLineUnitPrice(product, selectedVariant?.id), where
// `product` is productService's normalized product ({ ...data, price: productBasePrice(data) }).
const { resolveVariant } = await import(pathToFileURL(join(ROOT, "utils", "variantSelection.ts")).href);
const normalized = (data: Record<string, unknown>) => ({ ...data, price: productBasePrice(data) });
const detailsPrice = (product: any, selection: Record<string, string>) =>
  cartLineUnitPrice(product, resolveVariant(product.variants, selection)?.id);
const DETAILS_PRODUCT = normalized(VARIANT_PRODUCT);
check("P1. price=500, sellingPrice=450, no variant selected -> ₹450", () =>
  eq(detailsPrice(normalized({ price: 500, sellingPrice: 450 }), {}), 450));
check("P2. selected variant with own price 700 -> ₹700", () => eq(detailsPrice(DETAILS_PRODUCT, { Size: "L" }), 700));
check("P3. selected variant with price 0 -> base ₹450", () => eq(detailsPrice(DETAILS_PRODUCT, { Size: "M" }), 450));
check("P4. variant product with no complete selection yet -> base ₹450", () => eq(detailsPrice(DETAILS_PRODUCT, {}), 450));
check("P5. Product Details price == cart/checkout line price (cartLineUnitPrice) for every variant", () => {
  for (const v of VARIANT_PRODUCT.variants) {
    eq(detailsPrice(DETAILS_PRODUCT, v.attributes), cartLineUnitPrice(VARIANT_PRODUCT, v.id), v.id);
  }
});
check("P6. ProductDetailsScreen displays cartLineUnitPrice(product, selectedVariant?.id), not product.price", () => {
  const src = read(join(ROOT, "screens", "ProductDetailsScreen.tsx"));
  assert(/const displayPrice = cartLineUnitPrice\(product, selectedVariant\?\.id\);/.test(src), "displayPrice not computed with cartLineUnitPrice");
  assert(/₹\{displayPrice\}/.test(src), "price row does not show displayPrice");
  assert(!/₹\{product\.price\}/.test(src), "price row still shows product.price");
});

console.log("\nSource checks");
check("S1. productService base price uses productBasePrice (no price-before-sellingPrice)", () => {
  const src = read(join(ROOT, "services", "productService.ts"));
  assert(/price:\s*productBasePrice\(data\)/.test(src), "productBasePrice(data) not used");
  assert(!/data\.price\s*\?\?\s*data\.sellingPrice/.test(src), "old price ?? sellingPrice still present");
});
check("S2. cartService re-prices lines with cartLineUnitPrice", () => {
  const src = read(join(ROOT, "services", "cartService.ts"));
  assert(/cartLineUnitPrice\(live,\s*line\.variantId\)/.test(src), "live re-price missing");
});
check("S3. CheckoutScreen adds no GST on top and the grand total uses payableTotal", () => {
  assert(/const calculatedGst = 0;/.test(checkout), "calculatedGst is not 0");
  assert(!/gstPercent\s*\)?\s*\/\s*100|\*\s*gstPercent/.test(checkout), "GST-percent arithmetic still present");
  assert(/\{payableTotal\(\s*subtotal \+\s*shippingAmount \+\s*gstAmount -\s*\(appliedCoupon\?\.discountAmount \|\| 0\)\s*\)\}/.test(checkout),
    "grand total does not use payableTotal");
});
check("S4. no screen/service still prefers price over sellingPrice", () => {
  for (const file of ["services/productService.ts", "services/cartService.ts", "screens/CheckoutScreen.tsx"]) {
    assert(!/\.price\s*\?\?\s*[\w.]*sellingPrice/.test(read(join(ROOT, file))), `${file} prefers price over sellingPrice`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
