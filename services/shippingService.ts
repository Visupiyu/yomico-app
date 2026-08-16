import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase/firebase";

// Fallback defaults — used whenever settings/global is missing, unreadable,
// or has a malformed field, so a bad/absent settings doc can never break
// checkout. Admin-configurable value lives in Firestore; mirrors
// yogi-mart-next's lib/shipping.ts so mobile and web share the same rule.
export const FREE_SHIPPING_THRESHOLD = 499;

export const STANDARD_SHIPPING_CHARGE = 49;

export interface ShippingSettings {
  freeShippingThreshold: number;
  standardShippingCharge: number;
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", "global"));
    const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;

    return {
      freeShippingThreshold:
        typeof data?.freeShippingThreshold === "number"
          ? data.freeShippingThreshold
          : FREE_SHIPPING_THRESHOLD,
      standardShippingCharge:
        typeof data?.standardShippingCharge === "number"
          ? data.standardShippingCharge
          : STANDARD_SHIPPING_CHARGE,
    };
  } catch (error) {
    console.log("Shipping settings loading error:", error);

    return {
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      standardShippingCharge: STANDARD_SHIPPING_CHARGE,
    };
  }
}

export function calculateShipping(
  subtotal: number,
  settings: ShippingSettings
): number {
  return subtotal >= settings.freeShippingThreshold
    ? 0
    : settings.standardShippingCharge;
}
