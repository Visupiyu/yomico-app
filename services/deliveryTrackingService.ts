import { auth } from "../firebase/firebase";
import { API_BASE_URL } from "./apiConfig";

// Customer Delivery Tracking V1 — reads the EXISTING authoritative Delivery
// Engine endpoint (GET /api/delivery/order/[orderId]/shipments, deployed
// alongside the mobile place-order endpoint at API_BASE_URL). The server
// already verifies order ownership and returns an explicit, customer-safe
// allow-list projection (see the backend's lib/deliveryEngine/
// trackingProjections.ts) — this service never re-derives tracking state
// itself, and the shapes below mirror the server's response field-for-field.
//
// A historical/pre-shipment order (no DeliveryJob materialized yet) returns
// shipments: [] — callers should fall back to the order's own `status` field
// (the existing legacy tracker) in that case, never treat [] as an error.

export type CustomerShipment = {
  shipmentNumber: string;
  storeName: string;
  items: { name: string; qty: number }[];
  status: string;
  stage: string;
  providerLabel: "YOMICO delivery" | "Delivery partner" | null;
  deliveryPersonFirstName: string | null;
  milestones: { key: string; label: string; at: string }[];
  exceptionMessage: string | null;
  delivered: boolean;
  deliveredAt: string | null;
  outForDelivery: boolean;
};

export type OrderShipmentsResponse = {
  orderId: string;
  orderNumber: string | null;
  expectedDelivery: string | null;
  shipments: CustomerShipment[];
};

export class DeliveryTrackingError extends Error {}

export async function getOrderShipments(
  orderId: string
): Promise<OrderShipmentsResponse> {
  const user = auth.currentUser;

  if (!user) {
    throw new DeliveryTrackingError(
      "Please sign in to see delivery tracking for this order."
    );
  }

  let idToken: string;

  try {
    idToken = await user.getIdToken();
  } catch (error) {
    console.log("[deliveryTrackingService] getIdToken() failed:", error);
    throw new DeliveryTrackingError(
      "Couldn't verify your login session. Please try again."
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/delivery/order/${encodeURIComponent(orderId)}/shipments`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
  } catch (error) {
    console.log("[deliveryTrackingService] fetch() failed:", error);
    throw new DeliveryTrackingError(
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
    throw new DeliveryTrackingError(
      typeof data?.error === "string"
        ? data.error
        : "Could not load delivery tracking."
    );
  }

  return {
    orderId: typeof data.orderId === "string" ? data.orderId : orderId,
    orderNumber: typeof data.orderNumber === "string" ? data.orderNumber : null,
    expectedDelivery:
      typeof data.expectedDelivery === "string" ? data.expectedDelivery : null,
    shipments: Array.isArray(data.shipments) ? data.shipments : [],
  };
}
