/*
  All "pay at delivery" orders — old ones stored as "COD" before cash was
  disallowed, older mobile-only ones stored as "UPI", and new ones stored
  as "PAY_ON_DELIVERY_UPI" (reconciled to match the same canonical value
  the web app uses, so a single Firestore rule can authorize delivery-
  partner payment actions for orders from either platform) — are the same
  payment method from the customer's point of view: UPI collected at
  delivery, cash never accepted. This keeps display consistent across old
  and new orders without rewriting stored history.
*/

export const PAY_ON_DELIVERY_METHOD = "PAY_ON_DELIVERY_UPI";

const POD_METHOD_VALUES = ["COD", "UPI", "PAY_ON_DELIVERY_UPI"];

export function formatPaymentMethod(method?: string) {

  if (!method || POD_METHOD_VALUES.includes(method)) {
    return "Pay on Delivery (UPI Only)";
  }

  return method;

}

export function isPayOnDelivery(method?: string) {
  return !method || POD_METHOD_VALUES.includes(method);
}

// Display-only — the underlying paymentStatus values themselves
// (Pending/AwaitingVerification/Paid) are unchanged; this just avoids
// showing the internal "AwaitingVerification" wording to customers.
export function formatPaymentStatus(status?: string) {
  if (status === "AwaitingVerification") return "Awaiting Verification";
  return status || "Pending";
}
