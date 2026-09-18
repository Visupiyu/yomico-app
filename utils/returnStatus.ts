// Customer-facing display helpers for per-item Return / Replace requests.
//
// These MIRROR the website's lib/itemRequests display layer (status labels,
// badge tone, the "awaiting your pickup confirmation" check) so this app can
// render the SAME itemRequests documents the website backend already owns and
// writes. It is a DISPLAY MIRROR ONLY: the state machine, per-item
// eligibility, refund maths and every transition are enforced server-side by
// the website's item-request routes (the single source of truth). Nothing here
// authorizes, mutates, or trusts any client-supplied state — the app never
// writes an itemRequests document (firestore.rules denies all client writes);
// it only calls the server routes and reads its own requests.

export type ItemRequestType = "return" | "replace";

// Plain language for a normal shopper — never a raw status enum on screen.
const RETURN_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  PICKUP_PROPOSED: "Pickup time proposed",
  PICKUP_CONFIRMED: "Pickup confirmed",
  PICKUP_ASSIGNED: "Partner assigned",
  PICKED_UP: "Picked up",
  RECEIVED_BY_YOMICO: "Received at YOMICO",
  SELLER_INSPECTION: "Seller inspection",
  REFUND_PENDING: "Refund processing",
  REFUNDED: "Refunded",
  REJECTED: "Not approved",
  CANCELLED: "Cancelled",
  // Legacy label kept so a request created before the negotiation flow still
  // renders a name instead of a raw status enum.
  PICKUP_SCHEDULED: "Pickup scheduled",
};

const REPLACE_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  SELLER_PREPARING: "Seller preparing",
  READY_FOR_DELIVERY: "Ready for delivery",
  HANDED_OVER_TO_COURIER: "Handed over to courier",
  DELIVERED: "Delivered",
  REJECTED: "Not approved",
  CANCELLED: "Cancelled",
};

export function statusLabel(type: ItemRequestType, status: string): string {
  const map = type === "replace" ? REPLACE_LABELS : RETURN_LABELS;
  return map[status] ?? status;
}

/** Tone for a status badge: green ok, red bad, blue in-progress, grey idle. */
export function statusTone(
  status: string
): "ok" | "bad" | "running" | "idle" {
  if (status === "REFUNDED" || status === "DELIVERED") return "ok";
  if (status === "REJECTED" || status === "CANCELLED") return "bad";
  if (status === "REQUESTED") return "idle";
  return "running";
}

/** Hex colours for each tone, matched to the app's palette. */
export const TONE_COLORS: Record<
  "ok" | "bad" | "running" | "idle",
  { bg: string; fg: string }
> = {
  ok: { bg: "#DCFCE7", fg: "#15803D" },
  bad: { bg: "#FEE2E2", fg: "#B91C1C" },
  running: { bg: "#DBEAFE", fg: "#1D4ED8" },
  idle: { bg: "#F1F5F9", fg: "#475569" },
};

/**
 * A request is waiting on the CUSTOMER to accept or counter a proposed pickup
 * slot — the only moment the customer may respond (via the respond route).
 * Mirrors the website's lib/itemRequests.isAwaitingCustomerPickup.
 */
export function isAwaitingCustomerPickup(status: string): boolean {
  return status === "PICKUP_PROPOSED";
}

export function isTerminal(status: string): boolean {
  return status === "REJECTED" || status === "CANCELLED";
}

// The single true statement about where a refund goes — never "original
// payment method". Mirrors the website's REFUND_DESTINATION_LABEL.
export const REFUND_DESTINATION_LABEL = "YOMICO reward points";

// A short, customer-safe one-liner describing where a return has got to.
// Derived only from the coarse status — never from internal pickup/leg/job
// mechanics. Used under the status badge on the Returns screen.
export function returnProgressNote(
  type: ItemRequestType,
  status: string
): string {
  if (type === "replace") {
    switch (status) {
      case "REQUESTED":
      case "UNDER_REVIEW":
        return "We're reviewing your replacement request.";
      case "APPROVED":
      case "SELLER_PREPARING":
        return "Your replacement is being prepared.";
      case "READY_FOR_DELIVERY":
      case "HANDED_OVER_TO_COURIER":
        return "Your replacement is on its way.";
      case "DELIVERED":
        return "Your replacement has been delivered.";
      case "REJECTED":
        return "This replacement request wasn't approved.";
      case "CANCELLED":
        return "This replacement request was cancelled.";
      default:
        return "";
    }
  }
  switch (status) {
    case "REQUESTED":
    case "UNDER_REVIEW":
      return "We're reviewing your return request.";
    case "APPROVED":
      return "Approved — we'll propose a pickup time soon.";
    case "PICKUP_PROPOSED":
      return "A pickup time has been proposed. Please confirm it below.";
    case "PICKUP_CONFIRMED":
      return "Pickup confirmed. We're arranging collection.";
    case "PICKUP_ASSIGNED":
      return "A pickup partner has been assigned to collect your item.";
    case "PICKED_UP":
      return "Your item has been picked up.";
    case "RECEIVED_BY_YOMICO":
      return "We've received your returned item.";
    case "SELLER_INSPECTION":
      return "Your returned item is being checked.";
    case "REFUND_PENDING":
      return `Your refund to ${REFUND_DESTINATION_LABEL} is being processed.`;
    case "REFUNDED":
      return `Refunded to your ${REFUND_DESTINATION_LABEL}.`;
    case "REJECTED":
      return "This return request wasn't approved.";
    case "CANCELLED":
      return "This return request was cancelled.";
    default:
      return "";
  }
}
