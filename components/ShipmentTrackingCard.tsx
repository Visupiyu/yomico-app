import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CustomerShipment } from "../services/deliveryTrackingService";
import { getShipmentJourneySteps } from "../utils/shipmentTracking";

// Customer Delivery Tracking V1 — renders ONE Delivery Engine shipment as the
// fixed 5-step customer journey (Order Confirmed -> Picked Up -> In Transit
// -> Out for Delivery -> Delivered), or a plain banner for a
// cancelled/returned shipment. Presentation only: every value it shows comes
// straight from the server's own customer-safe projection
// (lib/deliveryEngine/trackingProjections.ts) — no rider/hub/custody/job/leg/
// OTP/GPS field is ever read or displayed here, and nothing is computed
// beyond the journey-step mapping in utils/shipmentTracking.ts.
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ShipmentTrackingCard({
  shipment,
}: {
  shipment: CustomerShipment;
}) {
  const isTerminalStop = shipment.status === "Cancelled" || shipment.status === "Returned";
  const steps = getShipmentJourneySteps(shipment);
  const deliveredAt = formatDate(shipment.deliveredAt);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.storeName} numberOfLines={1}>
          {shipment.storeName || "Seller"}
        </Text>
        <Text style={styles.shipmentStatus} numberOfLines={1}>
          {shipment.status}
        </Text>
      </View>

      {isTerminalStop ? (
        <View style={styles.terminalBanner}>
          <Text style={styles.terminalBannerText}>
            {shipment.status === "Cancelled"
              ? "This shipment has been cancelled."
              : "This shipment has been returned."}
          </Text>
        </View>
      ) : (
        <>
          {shipment.exceptionMessage ? (
            <View style={styles.exceptionBanner}>
              <Text style={styles.exceptionBannerText}>{shipment.exceptionMessage}</Text>
            </View>
          ) : null}

          <View style={styles.trackingRow}>
            <View style={styles.trackingLine} />

            {steps.map((step) => (
              <View key={step.key} style={styles.trackingItem}>
                <View style={step.active ? styles.trackingCircleActive : styles.trackingCircle}>
                  {step.active ? <Text style={styles.trackingCheck}>✓</Text> : null}
                </View>
                <Text style={styles.trackingTitle}>{step.label}</Text>
              </View>
            ))}
          </View>

          {shipment.deliveryPersonFirstName ? (
            <Text style={styles.metaLine}>
              {shipment.delivered ? "Delivered by " : "Being delivered by "}
              {shipment.deliveryPersonFirstName}
            </Text>
          ) : null}

          {shipment.delivered && deliveredAt ? (
            <Text style={styles.metaLine}>Delivered on {deliveredAt}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#222222",
    flex: 1,
    marginRight: 8,
  },
  shipmentStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  terminalBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
  },
  terminalBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  exceptionBanner: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  exceptionBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C2410C",
  },
  trackingRow: {
    position: "relative",
    paddingTop: 3,
  },
  trackingLine: {
    position: "absolute",
    left: 9,
    top: 12,
    bottom: 12,
    width: 2,
    backgroundColor: "#E5E5E5",
  },
  trackingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  trackingCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingCircleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingCheck: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  trackingTitle: {
    fontSize: 12,
    color: "#444444",
    marginLeft: 10,
    fontWeight: "600",
  },
  metaLine: {
    fontSize: 11.5,
    color: "#666666",
    marginTop: 2,
  },
});
