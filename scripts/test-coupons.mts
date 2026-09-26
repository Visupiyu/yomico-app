// @ts-nocheck — a Node script: the app's tsconfig type-checks every file but
// the project has no @types/node, so node:* imports can't be typed here.
//
// Coupon preview tests — no test framework, no extra dependencies.
//
//   node scripts/test-coupons.mts
//
// 1. The canonical evaluator (utils/couponRules.ts) behaves like the website /
//    server evaluator.
// 2. utils/couponRules.ts is an exact copy of the website's
//    lib/coupons/couponRules.ts. The website checkout is read from
//    ../yogi-mart-next (sibling of this repo) or from YOMICO_WEB_REPO. If it
//    can't be found the test FAILS rather than skipping.
// 3. Checkout still sends only the coupon code to both order endpoints, and
//    the old mobile-only coupon fields are gone from app code.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EVALUATOR = join(ROOT, "utils", "couponRules.ts");

const rules: typeof import("../utils/couponRules") = await import(
  pathToFileURL(EVALUATOR).href
);
const { evaluateCoupon, normalizeCouponCode } = rules;

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

function expectDiscount(coupon: Record<string, unknown>, subtotal: number, amount: number) {
  const result = evaluateCoupon(coupon, subtotal);
  assert(result.ok, `expected ok, got ${JSON.stringify(result)}`);
  assert(result.discountAmount === amount, `expected ${amount}, got ${result.discountAmount}`);
}

function expectRejected(
  coupon: Record<string, unknown> | null,
  subtotal: number,
  message: string
) {
  const result = evaluateCoupon(coupon, subtotal);
  assert(!result.ok, `expected rejection, got ${JSON.stringify(result)}`);
  assert(result.message === message, `expected "${message}", got "${result.message}"`);
}

const DAY = 24 * 60 * 60 * 1000;
const NOT_VALID = "This coupon is not valid.";
const INACTIVE = "This coupon is no longer active.";

console.log("\nEvaluator (utils/couponRules.ts)");

check("1. 10% of ₹2000 = ₹200", () =>
  expectDiscount({ code: "SAVE10", discount: 10, active: true }, 2000, 200));

check("2. active: true succeeds", () => {
  const result = evaluateCoupon({ code: "SAVE10", discount: 10, active: true }, 500);
  assert(result.ok && result.percent === 10, JSON.stringify(result));
});

check("3. active: false rejected", () =>
  expectRejected({ code: "SAVE10", discount: 10, active: false }, 2000, INACTIVE));

check("4. missing active rejected", () =>
  expectRejected({ code: "SAVE10", discount: 10 }, 2000, INACTIVE));

check("4b. non-boolean active (\"true\") rejected", () =>
  expectRejected({ code: "SAVE10", discount: 10, active: "true" }, 2000, INACTIVE));

check("5. discount 0 rejected", () =>
  expectRejected({ code: "SAVE10", discount: 0, active: true }, 2000, NOT_VALID));

check("6. discount below 0 rejected", () =>
  expectRejected({ code: "SAVE10", discount: -5, active: true }, 2000, NOT_VALID));

check("7. discount above 100 rejected", () =>
  expectRejected({ code: "SAVE10", discount: 101, active: true }, 2000, NOT_VALID));

check("8. malformed discount rejected (string / NaN / Infinity / missing)", () => {
  expectRejected({ code: "SAVE10", discount: "10", active: true }, 2000, NOT_VALID);
  expectRejected({ code: "SAVE10", discount: NaN, active: true }, 2000, NOT_VALID);
  expectRejected({ code: "SAVE10", discount: Infinity, active: true }, 2000, NOT_VALID);
  expectRejected({ code: "SAVE10", active: true }, 2000, NOT_VALID);
});

check("9. old discountType/discountValue format rejected", () => {
  expectRejected(
    { code: "OLD10", discountType: "percent", discountValue: 10, active: true },
    2000,
    NOT_VALID
  );
  expectRejected(
    { code: "OLD100", discountType: "flat", discountValue: 100, active: true },
    2000,
    NOT_VALID
  );
});

check("10. expired coupon rejected (Timestamp-like, Date, epoch ms)", () => {
  const past = new Date(Date.now() - DAY);
  const expired = "This coupon has expired.";
  expectRejected({ code: "X", discount: 10, active: true, expiresAt: { toDate: () => past } }, 2000, expired);
  expectRejected({ code: "X", discount: 10, active: true, expiresAt: past }, 2000, expired);
  expectRejected({ code: "X", discount: 10, active: true, expiresAt: past.getTime() }, 2000, expired);
});

check("10b. future expiry accepted", () => {
  const future = new Date(Date.now() + DAY);
  expectDiscount({ code: "X", discount: 10, active: true, expiresAt: { toDate: () => future } }, 2000, 200);
});

check("11. malformed expiresAt rejected", () => {
  expectRejected({ code: "X", discount: 10, active: true, expiresAt: "2099-01-01" }, 2000, NOT_VALID);
  expectRejected({ code: "X", discount: 10, active: true, expiresAt: new Date("nope") }, 2000, NOT_VALID);
});

check("12. minimum order violation rejected", () =>
  expectRejected(
    { code: "X", discount: 10, active: true, minOrderValue: 2500 },
    2000,
    "This coupon needs a minimum order of ₹2500."
  ));

check("12b. minimum order met accepted; malformed minOrderValue rejected", () => {
  expectDiscount({ code: "X", discount: 10, active: true, minOrderValue: 2000 }, 2000, 200);
  expectRejected({ code: "X", discount: 10, active: true, minOrderValue: "500" }, 2000, NOT_VALID);
});

check("13. maxDiscount caps the discount", () =>
  expectDiscount({ code: "X", discount: 10, active: true, maxDiscount: 150 }, 2000, 150));

check("13b. malformed maxDiscount rejected", () =>
  expectRejected({ code: "X", discount: 10, active: true, maxDiscount: 0 }, 2000, NOT_VALID));

check("14. 100% coupon is capped to subtotal", () =>
  expectDiscount({ code: "X", discount: 100, active: true }, 2000, 2000));

check("15. code matching is case-insensitive", () => {
  assert(normalizeCouponCode("save10") === "SAVE10", "lowercase");
  assert(normalizeCouponCode("  Save10 ") === "SAVE10", "mixed case + spaces");
  assert(normalizeCouponCode("   ") === null, "blank");
  const service = readFileSync(join(ROOT, "services", "couponService.ts"), "utf8");
  assert(
    /code\.trim\(\)\.toUpperCase\(\)/.test(service),
    "services/couponService.ts must query by trimmed UPPERCASE code"
  );
});

check("16. unknown coupon (no document) rejected", () =>
  expectRejected(null, 2000, "Invalid coupon"));

console.log("\nCopy consistency (website lib/coupons/couponRules.ts)");

check("17. utils/couponRules.ts is identical to the website evaluator", () => {
  const webRepo = process.env.YOMICO_WEB_REPO || resolve(ROOT, "..", "yogi-mart-next");
  const webFile = join(webRepo, "lib", "coupons", "couponRules.ts");
  assert(
    existsSync(webFile),
    `website evaluator not found at ${webFile} — set YOMICO_WEB_REPO to the website checkout`
  );
  // Line endings only: git may check either file out with CRLF on Windows.
  const normalize = (text: string) => text.replace(/\r\n/g, "\n");
  const web = normalize(readFileSync(webFile, "utf8"));
  const app = normalize(readFileSync(EVALUATOR, "utf8"));
  if (web !== app) {
    const webLines = web.split("\n");
    const appLines = app.split("\n");
    const line = webLines.findIndex((l, i) => l !== appLines[i]);
    throw new Error(`files differ (first difference at line ${line + 1}) — re-copy ${webFile}`);
  }
});

console.log("\nCheckout regression (screens/CheckoutScreen.tsx)");

const checkout = readFileSync(join(ROOT, "screens", "CheckoutScreen.tsx"), "utf8");

function requestBody(endpoint: string): string {
  const at = checkout.indexOf(`/api/mobile/${endpoint}\``);
  assert(at !== -1, `fetch to /api/mobile/${endpoint} not found`);
  const start = checkout.indexOf("JSON.stringify({", at);
  const end = checkout.indexOf("})", start);
  assert(start !== -1 && end !== -1, `request body for ${endpoint} not found`);
  return checkout.slice(start, end);
}

for (const endpoint of ["place-order", "create-payment-order"]) {
  check(`18. ${endpoint} sends only couponCode (no discount / amount / total)`, () => {
    const body = requestBody(endpoint);
    assert(/couponCode:\s*appliedCoupon\?\.code \|\| null/.test(body), "couponCode field missing");
    assert(!/discount|amount|total|subtotal|price/i.test(body), `unexpected pricing field in body:\n${body}`);
  });
}

check("19. appliedCoupon state keeps the { code, discountAmount } shape", () =>
  assert(
    /useState<\{ code: string; discountAmount: number \} \| null>/.test(checkout),
    "appliedCoupon state shape changed"
  ));

check("20. old discountType/discountValue fields are not used by app code", () => {
  // utils/couponRules.ts only names them in its "NOT SUPPORTED" comment.
  const skip = new Set([EVALUATOR]);
  const files: string[] = [join(ROOT, "App.tsx")];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name) && !skip.has(path)) files.push(path);
    }
  };
  for (const dir of ["screens", "services", "components", "hooks", "navigation", "utils", "types", "firebase"]) {
    walk(join(ROOT, dir));
  }
  // CheckoutScreen has an unrelated StyleSheet entry named discountValue
  // (`styles.discountValue` / `discountValue: {`) — that is not a coupon field.
  const oldField = /\bdiscountType\b|(?<!styles\.)\bdiscountValue\b(?!\s*:\s*\{)/;
  const offenders = files.filter((file) => oldField.test(readFileSync(file, "utf8")));
  assert(offenders.length === 0, `old coupon fields still referenced in: ${offenders.join(", ")}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
