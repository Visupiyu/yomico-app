import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { RootStackParamList } from "../navigation/AppNavigator";
import {
  getOrderFulfilment,
  createItemRequest,
  ReturnServiceError,
  type FulfilmentItem,
} from "../services/returnService";
import { REFUND_DESTINATION_LABEL } from "../utils/returnStatus";

type RequestReturnRouteProp = RouteProp<RootStackParamList, "RequestReturn">;
type Nav = NativeStackNavigationProp<RootStackParamList, "RequestReturn">;

const RETURN_REASONS = [
  "Damaged or defective item",
  "Wrong item received",
  "Item not as described",
  "Size or fit issue",
  "Quality not satisfactory",
  "Missing parts or accessories",
  "No longer needed",
  "Other",
];

const GREEN = "#16A34A";

// A single order line the customer can act on, tagged with its index in the
// ORDER's items array (what the server expects as parentIndex) and whether the
// backend fulfilment says it has been delivered (returns/replacements are only
// meaningful once delivered; the server enforces this regardless).
type SelectableItem = {
  parentIndex: number;
  name: string;
  image: string;
  qty: number;
  size: string;
  color: string;
  delivered: boolean;
};

export default function RequestReturnScreen() {
  const route = useRoute<RequestReturnRouteProp>();
  const navigation = useNavigation<Nav>();
  const order = route.params?.order;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fulfilment, setFulfilment] = useState<FulfilmentItem[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    typeof route.params?.parentIndex === "number"
      ? route.params.parentIndex
      : null
  );
  const [type, setType] = useState<"return" | "replace">("return");
  const [reason, setReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const orderItems: any[] = Array.isArray(order?.items) ? order.items : [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getOrderFulfilment(order.id);
        if (!cancelled) setFulfilment(data.items);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ReturnServiceError
              ? error.message
              : "Could not load this order's items."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (order?.id) void load();
    else {
      setLoading(false);
      setLoadError("This order could not be found.");
    }
    return () => {
      cancelled = true;
    };
  }, [order?.id]);

  // The set of productIds the backend reports as Delivered for this order.
  const deliveredProductIds = useMemo(() => {
    const s = new Set<string>();
    for (const f of fulfilment) {
      if (f.status === "Delivered" && f.productId) s.add(String(f.productId));
    }
    return s;
  }, [fulfilment]);

  const selectable: SelectableItem[] = useMemo(() => {
    return orderItems.map((item, index) => ({
      parentIndex: index,
      name: typeof item?.name === "string" ? item.name : "Item",
      image: typeof item?.image === "string" ? item.image : "",
      qty: Number(item?.qty) > 0 ? Number(item.qty) : 1,
      size: typeof item?.size === "string" ? item.size : "",
      color: typeof item?.color === "string" ? item.color : "",
      delivered:
        item?.id !== undefined &&
        item?.id !== null &&
        deliveredProductIds.has(String(item.id)),
    }));
  }, [orderItems, deliveredProductIds]);

  const eligibleItems = selectable.filter((i) => i.delivered);

  const submit = async () => {
    if (selectedIndex === null) {
      Alert.alert("Select an item", "Please choose the item you want to return or replace.");
      return;
    }
    if (!reason) {
      Alert.alert("Choose a reason", "Please select a reason for your request.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await createItemRequest({
        orderId: order.id,
        parentIndex: selectedIndex,
        type,
        reason,
        comments: comments.trim(),
      });
      Alert.alert(
        type === "replace" ? "Replacement requested" : "Return requested",
        type === "replace"
          ? "We've received your replacement request. You can track it under Returns & Refunds."
          : `We've received your return request. Once approved, we'll propose a pickup time for you to confirm. Your refund will go to your ${REFUND_DESTINATION_LABEL}.`,
        [
          {
            text: "View my returns",
            onPress: () => navigation.replace("Returns"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Couldn't submit",
        error instanceof ReturnServiceError
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return or Replace</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.muted}>Loading your order…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centre}>
          <MaterialIcons name="error-outline" size={40} color="#B91C1C" />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : eligibleItems.length === 0 ? (
        <View style={styles.centre}>
          <MaterialIcons name="inventory-2" size={40} color="#94A3B8" />
          <Text style={styles.muted}>
            None of the items in this order are eligible for a return or
            replacement yet. Items become eligible once they've been delivered.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {/* ITEM PICKER */}
          <Text style={styles.sectionTitle}>Which item?</Text>
          {eligibleItems.map((item) => {
            const selected = selectedIndex === item.parentIndex;
            return (
              <TouchableOpacity
                key={item.parentIndex}
                style={[styles.itemRow, selected && styles.itemRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedIndex(item.parentIndex)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImg} />
                ) : (
                  <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                    <MaterialIcons name="image" size={20} color="#CBD5E1" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Qty {item.qty}
                    {item.size ? ` · Size ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                  </Text>
                </View>
                <MaterialIcons
                  name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                  size={22}
                  color={selected ? GREEN : "#CBD5E1"}
                />
              </TouchableOpacity>
            );
          })}

          {/* TYPE */}
          <Text style={styles.sectionTitle}>What would you like?</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, type === "return" && styles.typeChipActive]}
              onPress={() => setType("return")}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name="assignment-return"
                size={18}
                color={type === "return" ? "#fff" : "#334155"}
              />
              <Text style={[styles.typeChipText, type === "return" && styles.typeChipTextActive]}>
                Return &amp; Refund
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeChip, type === "replace" && styles.typeChipActive]}
              onPress={() => setType("replace")}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name="swap-horiz"
                size={18}
                color={type === "replace" ? "#fff" : "#334155"}
              />
              <Text style={[styles.typeChipText, type === "replace" && styles.typeChipTextActive]}>
                Replace
              </Text>
            </TouchableOpacity>
          </View>
          {type === "return" ? (
            <Text style={styles.hint}>
              Approved returns are refunded to your {REFUND_DESTINATION_LABEL}.
            </Text>
          ) : (
            <Text style={styles.hint}>
              We&apos;ll send a fresh replacement once your request is approved.
            </Text>
          )}

          {/* REASON */}
          <Text style={styles.sectionTitle}>Reason</Text>
          <View style={styles.reasonWrap}>
            {RETURN_REASONS.map((r) => {
              const selected = reason === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, selected && styles.reasonChipActive]}
                  onPress={() => setReason(r)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.reasonChipText, selected && styles.reasonChipTextActive]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* COMMENTS */}
          <Text style={styles.sectionTitle}>Anything else? (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any details that help us process your request"
            placeholderTextColor="#94A3B8"
            value={comments}
            onChangeText={setComments}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {type === "replace" ? "Request Replacement" : "Request Return"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footNote}>
            No pickup date is needed now. After we review your request we&apos;ll
            propose a pickup time for you to confirm.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  muted: { color: "#64748B", textAlign: "center", fontSize: 14, lineHeight: 20 },
  errorText: { color: "#B91C1C", textAlign: "center", fontSize: 14 },
  body: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  itemRowSelected: { borderColor: GREEN, backgroundColor: "#F0FDF4" },
  itemImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#F1F5F9" },
  itemImgPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  itemMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  typeChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  typeChipText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  typeChipTextActive: { color: "#fff" },
  hint: { fontSize: 12, color: "#64748B", marginTop: 8 },
  reasonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  reasonChipActive: { borderColor: GREEN, backgroundColor: "#F0FDF4" },
  reasonChipText: { fontSize: 13, color: "#334155", fontWeight: "500" },
  reasonChipTextActive: { color: GREEN, fontWeight: "700" },
  textArea: {
    minHeight: 96,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footNote: {
    marginTop: 14,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
