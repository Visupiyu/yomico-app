import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { API_BASE_URL } from "./apiConfig";

// Customer Returns / Refunds V1 — talks to the EXISTING website item-request
// backend (the single source of truth). This app never writes an itemRequests
// document (firestore.rules denies all client writes); it POSTs to the
// server-authoritative routes, which verify the caller's ID token, confirm
// ownership, re-derive item identity + eligibility + refund amount, and enforce
// the state machine. The app only READS its own requests over the client SDK
// (owner read is allowed by firestore.rules: resource.data.userId == uid).
//
// Routes used (all under API_BASE_URL, all Bearer-authenticated):
//   POST /api/order-fulfilment        -> which of my order's items are delivered
//   POST /api/item-request            -> create a return/replace request
//   POST /api/item-request/respond    -> accept / counter a proposed pickup slot

export class ReturnServiceError extends Error {}

async function authedPost(path: string, body: unknown): Promise<any> {
  const user = auth.currentUser;
  if (!user) {
    throw new ReturnServiceError("Please sign in to continue.");
  }

  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch (error) {
    console.log("[returnService] getIdToken() failed:", error);
    throw new ReturnServiceError(
      "Couldn't verify your login session. Please try again."
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.log("[returnService] fetch() failed:", error);
    throw new ReturnServiceError(
      "Unable to connect. Check your internet connection and try again."
    );
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    // non-JSON response — data stays {}
  }

  if (!response.ok) {
    throw new ReturnServiceError(
      typeof data?.error === "string"
        ? data.error
        : "Something went wrong. Please try again."
    );
  }

  return data;
}

// ---- fulfilment (which items are delivered / returnable) -------------------

export type FulfilmentItem = {
  productId: string | null;
  itemKey: string | null;
  name: string;
  qty: number;
  size: string | null;
  color: string | null;
  status: string;
  deliveredAt: string | null;
};

export async function getOrderFulfilment(
  orderId: string
): Promise<{ items: FulfilmentItem[]; confirmed: boolean }> {
  const data = await authedPost("/api/order-fulfilment", { orderId });
  return {
    items: Array.isArray(data.items) ? (data.items as FulfilmentItem[]) : [],
    confirmed: !!data.confirmed,
  };
}

// ---- create a return / replace request -------------------------------------

export type CreateItemRequestInput = {
  orderId: string;
  /** Index of the line within the ORDER's items array (the server re-derives
   *  the vendor-scoped itemKey from this — it is never trusted for identity). */
  parentIndex: number;
  type: "return" | "replace";
  reason: string;
  comments?: string;
};

export async function createItemRequest(input: CreateItemRequestInput): Promise<{
  success: boolean;
  requestId: string;
  type: string;
  needsReview: boolean;
}> {
  const data = await authedPost("/api/item-request", {
    orderId: input.orderId,
    parentIndex: input.parentIndex,
    type: input.type,
    reason: input.reason,
    comments: input.comments ?? "",
  });
  return {
    success: !!data.success,
    requestId: typeof data.requestId === "string" ? data.requestId : "",
    type: typeof data.type === "string" ? data.type : input.type,
    needsReview: !!data.needsReview,
  };
}

// ---- respond to a proposed pickup slot -------------------------------------
//
// The YOMICO rule: the customer never sets an arbitrary pickup time. They may
// only ACCEPT the slot YOMICO proposed, or COUNTER with an alternative for
// YOMICO to re-coordinate. A counter is NOT a confirmed pickup — the server
// keeps the request awaiting a fresh proposal.

export async function respondToPickup(input: {
  requestId: string;
  action: "accept" | "counter";
  /** For a counter only: an ISO datetime string the customer suggests. */
  counterAt?: string;
}): Promise<{ success: boolean; status: string }> {
  const body: Record<string, unknown> = {
    requestId: input.requestId,
    action: input.action,
  };
  if (input.action === "counter" && input.counterAt) {
    body.counterAt = input.counterAt;
  }
  const data = await authedPost("/api/item-request/respond", body);
  return {
    success: !!data.success,
    status: typeof data.status === "string" ? data.status : "",
  };
}

// ---- read my own requests (real-time) --------------------------------------

export type ItemRequestDoc = {
  id: string;
  type?: "return" | "replace";
  status?: string;
  requestNumber?: string;
  reason?: string;
  orderId?: string;
  item?: {
    name?: string;
    image?: string;
    qty?: number;
    unitPrice?: number;
    size?: string;
    color?: string;
  };
  refund?: { amount?: number; destination?: string; credited?: boolean };
  pickup?: {
    proposedAt?: { seconds?: number };
    customerResponse?: string;
    counterCount?: number;
    scheduledAt?: { seconds?: number };
  };
  createdAt?: { seconds?: number };
  updatedAt?: { seconds?: number };
};

/**
 * Subscribe to the signed-in customer's own return/replace requests. A single
 * equality filter (userId) needs no composite index; newest-first ordering is
 * done in JS. firestore.rules allows the owner to read their own requests, so
 * this query is authorised without any client-supplied trust.
 */
export function subscribeMyItemRequests(
  uid: string,
  onData: (requests: ItemRequestDoc[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collection(db, "itemRequests"),
    where("userId", "==", uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ItemRequestDoc[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as ItemRequestDoc), id: docSnap.id });
      });
      list.sort(
        (a, b) =>
          (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
          (a.updatedAt?.seconds || a.createdAt?.seconds || 0)
      );
      onData(list);
    },
    onError
  );
}
