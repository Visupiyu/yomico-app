import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";

import { auth } from "../firebase/firebase";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  subscribeMyItemRequests,
  respondToPickup,
  ReturnServiceError,
  type ItemRequestDoc,
} from "../services/returnService";
import {
  statusLabel,
  statusTone,
  TONE_COLORS,
  isAwaitingCustomerPickup,
  returnProgressNote,
  REFUND_DESTINATION_LABEL,
  type ItemRequestType,
} from "../utils/returnStatus";

type Nav = NativeStackNavigationProp<RootStackParamList, "Returns">;

const GREEN = "#16A34A";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function secondsToDate(v?: { seconds?: number }): Date | null {
  if (!v || typeof v.seconds !== "number") return null;
  const d = new Date(v.seconds * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${h}:${mm} ${ampm}`;
}

// Dependency-free suggested slots: the next few days at a few daytime windows.
// The customer proposes one of these as an ALTERNATIVE; it is NOT a confirmed
// pickup — the server keeps the request awaiting a fresh YOMICO proposal.
function buildSuggestedSlots(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const hours = [10, 14, 17];
  const now = new Date();
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    for (const hour of hours) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, 0, 0, 0);
      out.push({ iso: d.toISOString(), label: formatDateTime(d) });
    }
  }
  return out;
}

export default function ReturnsScreen() {
  const navigation = useNavigation<Nav>();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ItemRequestDoc[]>([]);

  // Which request currently has its "suggest another time" chooser open.
  const [chooserFor, setChooserFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const slots = React.useMemo(() => buildSuggestedSlots(), []);

  useEffect(() => {
    let unsubReq: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubReq) {
        unsubReq();
        unsubReq = undefined;
      }
      if (!user) {
        setUid(null);
        setRequests([]);
        setLoading(false);
        return;
      }
      setUid(user.uid);
      setLoading(true);
      unsubReq = subscribeMyItemRequests(
        user.uid,
        (list) => {
          setRequests(list);
          setLoading(false);
        },
        (err) => {
          console.log("[ReturnsScreen] subscribe error:", err);
          setError("Could not load your returns. Please try again.");
          setLoading(false);
        }
      );
    });
    return () => {
      unsubAuth();
      if (unsubReq) unsubReq();
    };
  }, []);

  const accept = async (req: ItemRequestDoc) => {
    try {
      setBusyId(req.id);
      await respondToPickup({ requestId: req.id, action: "accept" });
      // The real-time subscription reflects the new status automatically.
    } catch (e) {
      Alert.alert(
        "Couldn't confirm",
        e instanceof ReturnServiceError ? e.message : "Please try again."
      );
    } finally {
      setBusyId(null);
    }
  };

  const counter = async (req: ItemRequestDoc, iso: string) => {
    try {
      setBusyId(req.id);
      await respondToPickup({ requestId: req.id, action: "counter", counterAt: iso });
      setChooserFor(null);
      Alert.alert(
        "Time suggested",
        "We've noted your preferred time and will propose an updated pickup slot for you to confirm."
      );
    } catch (e) {
      Alert.alert(
        "Couldn't send",
        e instanceof ReturnServiceError ? e.message : "Please try again."
      );
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (req: ItemRequestDoc) => {
    const type: ItemRequestType = req.type === "replace" ? "replace" : "return";
    const status = req.status || "REQUESTED";
    const tone = TONE_COLORS[statusTone(status)];
    const proposed = secondsToDate(req.pickup?.proposedAt);
    const awaiting = type === "return" && isAwaitingCustomerPickup(status);
    const countered = req.pickup?.customerResponse === "countered";
    const refundAmount = Number(req.refund?.amount) || 0;
    const chooserOpen = chooserFor === req.id;
    const busy = busyId === req.id;

    return (
      <View key={req.id} style={styles.card}>
        <View style={styles.cardTop}>
          {req.item?.image ? (
            <Image source={{ uri: req.item.image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <MaterialIcons name="image" size={20} color="#CBD5E1" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={2}>
              {req.item?.name || "Item"}
            </Text>
            <Text style={styles.subtle}>
              {type === "replace" ? "Replacement" : "Return"}
              {req.requestNumber ? ` · ${req.requestNumber}` : ""}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>
              {statusLabel(type, status)}
            </Text>
          </View>
        </View>

        <Text style={styles.progress}>{returnProgressNote(type, status)}</Text>

        {req.reason ? (
          <Text style={styles.reasonLine}>Reason: {req.reason}</Text>
        ) : null}

        {type === "return" && refundAmount > 0 ? (
          <Text style={styles.refundLine}>
            Refund: ₹{refundAmount} to your {REFUND_DESTINATION_LABEL}
          </Text>
        ) : null}

        {/* PICKUP CONFIRMATION — the YOMICO rule: accept or suggest another time */}
        {awaiting ? (
          <View style={styles.pickupBox}>
            <Text style={styles.pickupTitle}>Proposed pickup time</Text>
            <Text style={styles.pickupTime}>
              {proposed ? formatDateTime(proposed) : "A time has been proposed."}
            </Text>
            {countered ? (
              <Text style={styles.counteredNote}>
                You suggested a different time. We&apos;ll share an updated slot to confirm.
              </Text>
            ) : null}

            {!chooserOpen ? (
              <View style={styles.pickupActions}>
                <TouchableOpacity
                  style={[styles.acceptBtn, busy && styles.btnDisabled]}
                  onPress={() => accept(req)}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.acceptText}>Confirm this time</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setChooserFor(req.id)}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  <Text style={styles.counterText}>Suggest another time</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.chooser}>
                <Text style={styles.chooserHint}>Pick a time that suits you:</Text>
                <View style={styles.slotWrap}>
                  {slots.map((s) => (
                    <TouchableOpacity
                      key={s.iso}
                      style={styles.slotChip}
                      onPress={() => counter(req, s.iso)}
                      disabled={busy}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.slotText}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.cancelChooser}
                  onPress={() => setChooserFor(null)}
                  disabled={busy}
                >
                  <Text style={styles.cancelChooserText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns &amp; Refunds</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : !uid ? (
        <View style={styles.centre}>
          <MaterialIcons name="lock-outline" size={40} color="#94A3B8" />
          <Text style={styles.muted}>Please sign in to see your returns and refunds.</Text>
        </View>
      ) : error ? (
        <View style={styles.centre}>
          <MaterialIcons name="error-outline" size={40} color="#B91C1C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centre}>
          <MaterialIcons name="assignment-return" size={44} color="#94A3B8" />
          <Text style={styles.muted}>
            You haven&apos;t requested any returns or replacements yet. You can start
            one from an order&apos;s details once it&apos;s delivered.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {requests.map(renderCard)}
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
  body: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#F1F5F9" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  subtle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  progress: { fontSize: 13, color: "#334155", marginTop: 10, lineHeight: 19 },
  reasonLine: { fontSize: 12, color: "#64748B", marginTop: 6 },
  refundLine: { fontSize: 13, color: GREEN, fontWeight: "600", marginTop: 6 },
  pickupBox: {
    marginTop: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  pickupTitle: { fontSize: 12, fontWeight: "700", color: "#166534" },
  pickupTime: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  counteredNote: { fontSize: 12, color: "#B45309", marginTop: 6 },
  pickupActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  counterBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  counterText: { color: GREEN, fontWeight: "700", fontSize: 13 },
  chooser: { marginTop: 12 },
  chooserHint: { fontSize: 12, color: "#475569", marginBottom: 8 },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  slotText: { fontSize: 12, color: "#0F172A", fontWeight: "600" },
  cancelChooser: { marginTop: 10, alignItems: "center" },
  cancelChooserText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
});
