export const STATUS_STEPS = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "#FFF4D6", text: "#A66A00" },
  Confirmed: { bg: "#E0F2FE", text: "#0284C7" },
  Packed: { bg: "#EDE9FE", text: "#7C3AED" },
  Shipped: { bg: "#E0E7FF", text: "#4F46E5" },
  "Out for delivery": { bg: "#FFF7ED", text: "#EA580C" },
  Delivered: { bg: "#DCFCE7", text: "#16A34A" },
  Cancelled: { bg: "#FEE2E2", text: "#DC2626" },
};

export function getStatusColors(status?: string) {
  return STATUS_COLORS[status || "Pending"] || STATUS_COLORS.Pending;
}
