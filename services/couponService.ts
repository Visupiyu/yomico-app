import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { evaluateCoupon } from "../utils/couponRules";

// Preview only. The server re-evaluates the coupon itself on place-order /
// create-payment-order and is authoritative (including one-use-per-customer);
// only the code is ever sent. utils/couponRules.ts is an exact copy of the
// website's lib/coupons/couponRules.ts, so this preview applies the same rules.
export async function validateCoupon(
  code: string,
  subtotal: number
) {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    throw new Error("Please enter a coupon code.");
  }

  const q = query(
    collection(db, "coupons"),
    where("code", "==", cleanCode),
    limit(1)
  );

  const snapshot = await getDocs(q);

  const evaluated = evaluateCoupon(
    snapshot.empty ? null : snapshot.docs[0].data(),
    subtotal
  );

  if (!evaluated.ok) {
    throw new Error(evaluated.message);
  }

  return {
    code: cleanCode,
    discountAmount: evaluated.discountAmount,
  };
}
