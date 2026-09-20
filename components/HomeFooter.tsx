import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "../services/apiConfig";

// Customer App Home footer — parity with the production website Footer
// (yogi-mart-next/components/Footer.tsx), adapted for mobile: the website's five
// columns become stacked, collapsible groups, and every legal/company/seller
// link opens the corresponding live page on API_BASE_URL (https://www.yomico.in)
// in the device browser. Uses only React Native's built-in Linking — no new
// dependency. Presentation only: no auth, cart, checkout, order or other
// business logic. Seller *Login* and the "Download App" buttons from the web
// footer are intentionally omitted (not customer-app surfaces).

type FooterLink = { label: string; path: string };
type FooterGroup = { title: string; links: FooterLink[] };

const GROUPS: FooterGroup[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", path: "/about" },
      { label: "Careers", path: "/careers" },
      { label: "Blog", path: "/blog" },
      { label: "Press", path: "/press" },
      { label: "AI Shopping Assistant", path: "/assistant" },
    ],
  },
  {
    title: "Help & Policies",
    links: [
      { label: "Contact Us", path: "/contact" },
      { label: "FAQ", path: "/faq" },
      { label: "Returns & Refunds", path: "/return-refund" },
      { label: "Shipping Policy", path: "/shipping-policy" },
      { label: "Cancellation Policy", path: "/cancellation-policy" },
      { label: "Privacy Policy", path: "/privacy-policy" },
      { label: "Cookie Policy", path: "/cookie-policy" },
      { label: "Terms & Conditions", path: "/terms" },
    ],
  },
  {
    title: "Sell / Partner",
    links: [
      { label: "Sell on YOMICO", path: "/sell" },
      { label: "Become a Seller", path: "/vendor-register" },
      { label: "Seller Agreement", path: "/seller-agreement" },
      { label: "Become a Delivery Partner", path: "/delivery-register" },
      { label: "Partner as a Delivery Company", path: "/delivery-company-register" },
    ],
  },
];

const TRUST: { icon: string; label: string }[] = [
  { icon: "local-shipping", label: "Fast Delivery" },
  { icon: "verified-user", label: "Secure Payments" },
  { icon: "autorenew", label: "Easy Returns" },
  { icon: "verified", label: "Trusted Sellers" },
];

export default function HomeFooter() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const openLink = (path: string) => {
    Linking.openURL(`${API_BASE_URL}${path}`).catch(() => {});
  };

  return (
    <View style={styles.footer}>
      <Text style={styles.brand}>YOMICO</Text>
      <Text style={styles.tagline}>
        India&apos;s Trusted Multi-Vendor Marketplace. Shop groceries, fashion,
        electronics, beauty and much more from trusted sellers.
      </Text>

      {GROUPS.map((g) => {
        const isOpen = openGroup === g.title;
        return (
          <View key={g.title} style={styles.group}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.groupHeader}
              onPress={() => setOpenGroup(isOpen ? null : g.title)}
            >
              <Text style={styles.groupTitle}>{g.title}</Text>
              <MaterialIcons
                name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={22}
                color="#496454"
              />
            </TouchableOpacity>
            {isOpen ? (
              <View style={styles.groupLinks}>
                {g.links.map((l) => (
                  <TouchableOpacity key={l.path} activeOpacity={0.7} onPress={() => openLink(l.path)}>
                    <Text style={styles.link}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={styles.trustRow}>
        {TRUST.map((t) => (
          <View key={t.label} style={styles.trustItem}>
            <MaterialIcons name={t.icon as never} size={18} color="#16A34A" />
            <Text style={styles.trustText}>{t.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.copyright}>
        © 2026 YOMICO. All rights reserved.{"\n"}Made with ❤️ in India 🇮🇳
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#F1FBF4",
    borderTopWidth: 1,
    borderTopColor: "#D5F2DF",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 26,
    marginTop: 18,
  },
  brand: { fontSize: 24, fontWeight: "900", color: "#16A34A", letterSpacing: 1 },
  tagline: { fontSize: 12.5, color: "#496454", lineHeight: 19, marginTop: 6, marginBottom: 12 },
  group: { borderTopWidth: 1, borderTopColor: "#E1EFE7" },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  groupTitle: { fontSize: 14.5, fontWeight: "800", color: "#1F2D26" },
  groupLinks: { paddingBottom: 12, gap: 12 },
  link: { fontSize: 13.5, color: "#3B5647", paddingVertical: 2 },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    rowGap: 12,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  trustText: { fontSize: 12.5, color: "#3B5647" },
  copyright: { fontSize: 11.5, color: "#7A8580", textAlign: "center", lineHeight: 18, marginTop: 20 },
});
