import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

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
    where("code", "==", cleanCode)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("This coupon code is invalid.");
  }

  const coupon = snapshot.docs[0].data();

  if (coupon.active === false) {
    throw new Error("This coupon is no longer active.");
  }

  if (
    coupon.expiresAt?.toDate &&
    coupon.expiresAt.toDate() < new Date()
  ) {
    throw new Error("This coupon has expired.");
  }

  if (
    coupon.minOrderValue &&
    subtotal < coupon.minOrderValue
  ) {
    throw new Error(
      `This coupon needs a minimum order of ₹${coupon.minOrderValue}.`
    );
  }

  let discountAmount = 0;

  if (coupon.discountType === "percent") {
    discountAmount = (subtotal * (coupon.discountValue || 0)) / 100;

    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue || 0;
  }

  discountAmount = Math.min(discountAmount, subtotal);

  return {
    code: cleanCode,
    discountAmount,
  };
}
