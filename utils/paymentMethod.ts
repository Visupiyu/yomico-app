/*
  All "pay at delivery" orders — old ones stored as "COD" before
  cash was disallowed, and new ones stored as "UPI" — are the same
  payment method from the customer's point of view: UPI collected
  at delivery, cash never accepted. This keeps display consistent
  across old and new orders without rewriting stored history.
*/

export const PAY_ON_DELIVERY_METHOD = "UPI";

export function formatPaymentMethod(method?: string) {

  if (method === "COD" || method === "UPI" || !method) {
    return "Pay on Delivery (UPI Only)";
  }

  return method;

}

export function isPayOnDelivery(method?: string) {
  return method === "COD" || method === "UPI" || !method;
}
