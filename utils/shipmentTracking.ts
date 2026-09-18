import type { CustomerShipment } from "../services/deliveryTrackingService";

// Customer Delivery Tracking V1 — maps ONE Delivery Engine shipment's raw
// `stage` (see the backend's lib/deliveryEngine/trackingProjections.ts
// friendlyStage()) onto the fixed customer journey:
//   Order Confirmed -> Picked Up -> In Transit -> Out for Delivery -> Delivered
//
// The backend's own "At origin hub" / "At destination hub" / "Assigned for
// final delivery" COMPANY_HUB stages are DELIBERATELY folded into "In
// Transit" here rather than shown as their own steps — the customer journey
// stays exactly five stages, never a fabricated sixth "At Destination Hub"
// step the spec explicitly says not to invent.
export type ShipmentJourneyStep = {
  key: string;
  label: string;
  active: boolean; // reached or passed
};

const TRANSIT_STAGES = new Set<string>([
  "At origin hub",
  "In transit",
  "At destination hub",
  "Assigned for final delivery",
]);

function stageStepIndex(stage: string): number {
  if (stage === "Delivered") return 4;
  if (stage === "Out for delivery") return 3;
  if (TRANSIT_STAGES.has(stage)) return 2;
  if (stage === "Picked up") return 1;
  // "Preparing for delivery" or any unrecognized value — least presumptuous
  // default: not yet picked up.
  return 0;
}

/**
 * The ordered journey steps for one shipment, with `active` marking every
 * step already reached. YOMICO Direct (providerLabel "YOMICO delivery") is a
 * single-leg seller -> rider -> customer journey with no hub/transit leg at
 * all (see the backend's execution.ts YOMICO_DIRECT_FORBIDDEN) — its journey
 * OMITS "In Transit" entirely rather than showing a step that can never
 * activate. A COMPANY shipment ("Delivery partner") keeps all five steps.
 */
export function getShipmentJourneySteps(
  shipment: Pick<CustomerShipment, "stage" | "providerLabel">
): ShipmentJourneyStep[] {
  const isDirect = shipment.providerLabel === "YOMICO delivery";
  const reached = stageStepIndex(shipment.stage);

  const steps: { key: string; label: string; index: number }[] = [
    { key: "confirmed", label: "Order Confirmed", index: 0 },
    { key: "picked_up", label: "Picked Up", index: 1 },
    ...(isDirect ? [] : [{ key: "in_transit", label: "In Transit", index: 2 }]),
    { key: "out_for_delivery", label: "Out for Delivery", index: 3 },
    { key: "delivered", label: "Delivered", index: 4 },
  ];

  return steps.map((s) => ({ key: s.key, label: s.label, active: reached >= s.index }));
}
