import React, {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  Dimensions,
  Image,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { getProducts } from "../services/productService";
import { getRecentlyViewed } from "../services/recentlyViewedService";
import ProductCard from "../components/ProductCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types"

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "MainTabs">;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const heroRef = useRef<ScrollView>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // categoryId values are the real YOMICO catalog-tree top-level node ids
  // (yogi/lib/catalog/catalogTree.ts) — the same values stored on product
  // docs as `categoryId`, NOT display names. Kept null where a slide isn't
  // meant to filter by category at all.
  const heroSlides = [
    {
      image: require("../assets/home/hero-smartphones.png"),
      categoryId: "MOBILES",
      categoryName: "Mobiles",
    },
    {
      image: require("../assets/home/hero-big-deals.png"),
      categoryId: null,
      categoryName: null,
    },
    {
      image: require("../assets/home/hero-home-appliances.png"),
      categoryId: null,
      categoryName: null,
    },
    {
      image: require("../assets/home/hero-fashion.png"),
      categoryId: "FASHION",
      categoryName: "Fashion",
    },
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [defaultAddress, setDefaultAddress] = useState<any>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<any[]>([]);

  // Home stays mounted while switching tabs, so a mount-only load
  // would never reflect a product viewed elsewhere (Recently Viewed)
  // or a default address changed on the Address screen — both would
  // keep showing whatever was true when Home first mounted, until the
  // app is restarted. Reload on every focus instead.
  useFocusEffect(
    useCallback(() => {
      loadProducts();
      loadDefaultAddress();
      loadRecentlyViewed();
    }, [])
  );

  async function loadRecentlyViewed() {
    const data = await getRecentlyViewed(8);
    setRecentlyViewedProducts(data);
  }

  async function loadDefaultAddress() {
    const user = auth.currentUser;

    // Home never unmounts, so its state survives logout and any later
    // login on the same device session. Without clearing here, the
    // "Deliver to" line kept showing the previous customer's address
    // after logout, and would keep showing it for a new customer who
    // has no default address of their own.
    if (!user) {
      setDefaultAddress(null);
      return;
    }

    try {
      const q = query(
        collection(db, "addresses"),
        where("userId", "==", user.uid),
        where("isDefault", "==", true)
      );

      const snapshot = await getDocs(q);

      setDefaultAddress(!snapshot.empty ? snapshot.docs[0].data() : null);
    } catch (error) {
      console.log("Default address loading error:", error);
    }
  }

  async function handleSubscribe() {
    const email = newsletterEmail.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      await addDoc(collection(db, "newsletterSubscribers"), {
        email,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Subscribed", "Thanks for subscribing!");
      setNewsletterEmail("");
    } catch (error) {
      console.log("Newsletter subscribe error:", error);
      Alert.alert("Error", "Unable to subscribe right now.");
    }
  }

  async function loadProducts() {
    try {
      setError(false);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      // getProducts() now throws on a real Firestore failure instead of
      // silently returning [], so a failed load shows a proper error +
      // Retry rather than a misleading "No products available".
      console.log("Product loading error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Matches the website's own customer-facing category bar exactly —
  // same 10 names, same order (yogi/components/CategoryStrip.tsx) — not
  // the 9 raw catalog-tree top-level ids used before. Men Fashion/Women
  // Fashion are real catalog SUB-categories under Fashion (ids
  // FASHION_MEN/FASHION_WOMEN), never their own top-level category, so
  // they're matched via `subCategoryId`; every other entry here is a real
  // top-level category matched via `categoryId` — same field CategoryStrip
  // resolves to via findNodeByName()/isTopLevelCategory() on the web.
  // Ids/names verified read-only against yogi/lib/catalog/catalogTree.ts,
  // not invented. Emoji icons are this app's own presentational choice,
  // same as before.
  const categories: {
    id: string;
    name: string;
    icon: string;
    field: "categoryId" | "subCategoryId";
  }[] = [
    { id: "GROCERY", name: "Grocery", icon: "🛒", field: "categoryId" },
    { id: "FASHION_MEN", name: "Men Fashion", icon: "👕", field: "subCategoryId" },
    { id: "FASHION_WOMEN", name: "Women Fashion", icon: "👗", field: "subCategoryId" },
    { id: "KIDS_FASHION", name: "Kids Fashion", icon: "👶", field: "categoryId" },
    { id: "BEAUTY", name: "Beauty", icon: "💄", field: "categoryId" },
    { id: "ELECTRONICS", name: "Electronics", icon: "🔌", field: "categoryId" },
    { id: "FURNITURE", name: "Furniture", icon: "🛋️", field: "categoryId" },
    { id: "MOBILES", name: "Mobiles", icon: "📱", field: "categoryId" },
    { id: "APPLIANCES", name: "Appliances", icon: "🏠", field: "categoryId" },
    { id: "BOOKS", name: "Books", icon: "📚", field: "categoryId" },
  ];

  // Trending = most-viewed, matching the website's TrendingProducts query
  // (yogi/components/TrendingProducts.jsx: orderBy("views","desc") limit 8).
  // The previous mobile version took the first 8 by createdAt (newest), a
  // different metric.
  const trendingProducts = [...products]
    .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
    .slice(0, 8);

  // Best Sellers = most units sold, matching the website's BestSellers query
  // (yogi/components/BestSellers.jsx: orderBy("sales","desc") limit 12). The
  // previous mobile version ranked by rating, a different metric.
  const bestSellerProducts = [...products]
    .sort((a, b) => (Number(b.sales) || 0) - (Number(a.sales) || 0))
    .slice(0, 12);

  // Best Deals = products genuinely discounted 40%+ off MRP — the website's
  // authoritative "Best Deals" definition (yogi/components/home/FlashSale.jsx
  // links to /search?minDiscount=40). No countdown and no fabricated sale
  // labels: the website deliberately removed both for lack of backing data.
  const bestDeals = products.filter((p) => {
    const price = Number(p.price) || 0;
    const mrp = Number(p.mrp) || 0;
    const explicit = Number(p.discountPercent) || 0;
    const derived = mrp > 0 && mrp > price ? ((mrp - price) / mrp) * 100 : 0;
    return Math.max(explicit, derived) >= 40;
  });

  // The 8 per-category product shelves the website Home renders
  // (yogi/app/page.tsx CATEGORY_ROWS), in the same order. `field` mirrors the
  // website's top-level-vs-subcategory distinction — Men/Women Fashion are
  // subcategories of Fashion, matched on subCategoryId. Ids verified against
  // yogi/lib/catalog/catalogTree.ts, not invented.
  const CATEGORY_SHELVES: {
    title: string;
    id: string;
    field: "categoryId" | "subCategoryId";
    categoryName: string;
  }[] = [
    { title: "📱 Mobiles", id: "MOBILES", field: "categoryId", categoryName: "Mobiles" },
    { title: "👔 Men Fashion", id: "FASHION_MEN", field: "subCategoryId", categoryName: "Men Fashion" },
    { title: "👗 Women Fashion", id: "FASHION_WOMEN", field: "subCategoryId", categoryName: "Women Fashion" },
    { title: "🧒 Kids Fashion", id: "KIDS_FASHION", field: "categoryId", categoryName: "Kids Fashion" },
    { title: "💻 Electronics", id: "ELECTRONICS", field: "categoryId", categoryName: "Electronics" },
    { title: "💄 Beauty", id: "BEAUTY", field: "categoryId", categoryName: "Beauty" },
    { title: "🏠 Appliances", id: "APPLIANCES", field: "categoryId", categoryName: "Appliances" },
    { title: "🛒 Grocery", id: "GROCERY", field: "categoryId", categoryName: "Grocery" },
  ];

  // Client-side category filter over the single already-loaded product list —
  // exactly how the website's byCategory() derives its shelves from one fetch
  // (yogi/app/page.tsx), rather than issuing 8 extra Firestore queries. A
  // subcategory shelf matches subCategoryId OR leafCategoryId, mirroring the
  // website.
  function productsForShelf(shelf: {
    id: string;
    field: "categoryId" | "subCategoryId";
  }) {
    if (shelf.field === "subCategoryId") {
      return products.filter(
        (p) => p.subCategoryId === shelf.id || p.leafCategoryId === shelf.id
      );
    }
    return products.filter((p) => p.categoryId === shelf.id);
  }

  // ========== SHARED RENDER ==========
  // Lightweight placeholder row while products load — the mobile equivalent
  // of the website's ProductSkeleton cards, so a slow load reads as
  // "loading" rather than "empty".
  function renderSkeletonRow() {
    return (
      <View style={styles.skeletonRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLineNarrow} />
          </View>
        ))}
      </View>
    );
  }

  function renderProducts(data: any[]) {
    // Loading is handled once at the section-group level (single skeleton),
    // so this only distinguishes empty from populated.
    if (!data.length) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productList}
      />
    );
  }

  // categoryParam, when provided, opens that category in Search (same params
  // the category icon strip uses) instead of the generic search screen.
  function renderSection(
    title: string,
    data: any[],
    categoryParam?: {
      categoryId?: string;
      subCategoryId?: string;
      categoryName?: string;
    }
  ) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              categoryParam
                ? navigation.navigate("Search", categoryParam)
                : navigation.navigate("Search")
            }
          >
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {renderProducts(data)}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandLogo}>YOMICO</Text>
            <Text style={styles.brandTagline}>
              India's Multi-Vendor Marketplace
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Search")}
        >
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={24} color="#263238" />
            <Text style={styles.searchPlaceholder}>Search on YOMICO...</Text>
            <MaterialIcons name="mic-none" size={22} color="#263238" />
          </View>
        </TouchableOpacity>

        {/* DELIVERY LOCATION */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.deliveryBar}
          onPress={() => navigation.navigate("Address")}
        >
          <MaterialIcons name="location-on" size={21} color="#16A34A" />
          <View style={styles.deliveryContent}>
            <Text style={styles.deliveryLabel}>Deliver to</Text>
            <Text style={styles.deliveryAddress} numberOfLines={1}>
              {defaultAddress
                ? `${defaultAddress.address}, ${defaultAddress.city} ${defaultAddress.pincode}`
                : "Select your delivery location"}
            </Text>
          </View>
          <MaterialIcons name="keyboard-arrow-right" size={22} color="#555" />
        </TouchableOpacity>

        {/* CATEGORIES */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Search")}
            >
              <Text style={styles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.category}
                onPress={() =>
                  navigation.navigate("Search", {
                    ...(item.field === "subCategoryId"
                      ? { subCategoryId: item.id }
                      : { categoryId: item.id }),
                    categoryName: item.name,
                  })
                }
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* HERO CAROUSEL */}
        <View style={styles.heroCarousel}>
          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x /
                  event.nativeEvent.layoutMeasurement.width
              );
              setHeroIndex(index);
            }}
          >
            {heroSlides.map((slide, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.95}
                style={styles.heroSlide}
                onPress={() =>
                  slide.categoryId
                    ? navigation.navigate("Search", {
                        categoryId: slide.categoryId,
                        categoryName: slide.categoryName || undefined,
                      })
                    : navigation.navigate("Search")
                }
              >
                <Image
                  source={slide.image}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.heroDotsOverlay}>
            {heroSlides.map((_, index) => (
              <View
                key={index}
                style={
                  index === heroIndex ? styles.heroDotActive : styles.heroDot
                }
              />
            ))}
          </View>
        </View>

        {/* PRODUCT SECTIONS — all derive from the single products load, so a
            failure/empty is handled once here (error + Retry, or empty),
            never a misleading per-section "No products available". */}
        {loading ? (
          <View style={styles.section}>{renderSkeletonRow()}</View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Unable to load products.</Text>
            <Text style={styles.errorSubtitle}>Please try again.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={loadProducts}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No products available right now.
            </Text>
          </View>
        ) : (
          <>
            {/* BEST DEALS — real 40%+ off-MRP products; no countdown, no
                fabricated labels (matches website "Best Deals"). Hidden when
                nothing genuinely qualifies. */}
            {bestDeals.length > 0 &&
              renderSection("🏷️ Best Deals", bestDeals)}

            {/* BEST SELLERS — ranked by units sold */}
            {renderSection("🏆 Best Sellers", bestSellerProducts)}

            {/* TRENDING — ranked by views */}
            {renderSection("Trending Products", trendingProducts)}

            {/* PER-CATEGORY SHELVES — same 8 shelves/order as website Home */}
            {CATEGORY_SHELVES.map((shelf) => {
              const shelfProducts = productsForShelf(shelf);
              if (shelfProducts.length === 0) return null;
              const categoryParam =
                shelf.field === "subCategoryId"
                  ? { subCategoryId: shelf.id, categoryName: shelf.categoryName }
                  : { categoryId: shelf.id, categoryName: shelf.categoryName };
              return (
                <React.Fragment key={shelf.id}>
                  {renderSection(shelf.title, shelfProducts, categoryParam)}
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* RECENTLY VIEWED — independent source (recentlyViewedService); only
            shown when the customer actually has recently-viewed items. */}
        {recentlyViewedProducts.length > 0 &&
          renderSection("Recently Viewed", recentlyViewedProducts)}

        {/* WHY SHOP YOMICO */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Shop YOMICO?</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="verified-user" size={24} color="#16A34A" />
              <Text style={styles.infoText}>Trusted Sellers</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="lock" size={24} color="#16A34A" />
              <Text style={styles.infoText}>Secure Payments</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="support-agent" size={24} color="#16A34A" />
              <Text style={styles.infoText}>Easy Support</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="local-shipping" size={24} color="#16A34A" />
              <Text style={styles.infoText}>Reliable Delivery</Text>
            </View>
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Our support team is here to help you.
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Support")}
          >
            <Text style={styles.supportButtonText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* NEWSLETTER */}
        <View style={styles.newsletter}>
          <Text style={styles.newsletterTitle}>Stay Updated</Text>
          <Text style={styles.newsletterText}>
            Get updates about new products and offers.
          </Text>
          <View style={styles.newsletterInputRow}>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#888888"
              style={styles.newsletterInput}
              value={newsletterEmail}
              onChangeText={setNewsletterEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={styles.subscribeButton}
              activeOpacity={0.8}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>YOMICO</Text>
          <Text style={styles.footerDescription}>
            Your everyday marketplace.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate("Support")}>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>
            © 2026 YOMICO. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomNavigationSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 13,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  // Header
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#E9FFF1",
    borderBottomWidth: 1,
    borderBottomColor: "#D5F2DF",
  },
  brandBlock: {
    alignItems: "flex-start",
  },
  brandLogo: {
    fontSize: 27,
    fontWeight: "900",
    color: "#16A34A",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 10,
    color: "#496454",
    marginTop: 2,
  },

  // Search
  searchBox: {
    height: 52,
    marginHorizontal: 13,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DD",
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    fontSize: 15,
    color: "#7A8580",
  },

  // Delivery
  deliveryBar: {
    marginHorizontal: 13,
    marginTop: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8E4",
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryContent: {
    flex: 1,
    marginLeft: 8,
  },
  deliveryLabel: {
    fontSize: 10,
    color: "#777777",
  },
  deliveryAddress: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#252525",
  },

  // Categories
  categorySection: {
    marginTop: 16,
  },
  categoryList: {
    paddingHorizontal: 13,
  },
  category: {
    width: 72,
    alignItems: "center",
    marginRight: 10,
  },
  categoryIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8E4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 27,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },

  // Hero
  heroCarousel: {
    marginHorizontal: 13,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  heroSlide: {
    width: Dimensions.get("window").width - 26,
    height: 190,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroDotsOverlay: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  heroDotActive: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginHorizontal: 3,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 3,
  },

  // Product list (shared)
  productList: {
    paddingHorizontal: 12,
  },
  emptyBox: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#777777",
  },

  // Loading skeleton (placeholder cards while products load).
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  skeletonCard: {
    width: 158,
    marginRight: 10,
    marginVertical: 5,
  },
  skeletonImage: {
    height: 142,
    borderRadius: 13,
    backgroundColor: "#ECEFEE",
  },
  skeletonLineWide: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ECEFEE",
    marginTop: 10,
  },
  skeletonLineNarrow: {
    height: 12,
    width: "55%",
    borderRadius: 6,
    backgroundColor: "#ECEFEE",
    marginTop: 8,
  },

  // Product-load error state (with Retry).
  errorBox: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  errorSubtitle: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: "#DC2626",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  // Best Sellers
  bestSellerCard: {
    width: 168,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 10,
    paddingBottom: 11,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6ECE8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  bestSellerBadge: {
    alignSelf: "flex-start",
    marginLeft: 8,
    marginTop: 8,
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  bestSellerBadgeText: {
    color: "#A16207",
    fontSize: 9,
    fontWeight: "800",
  },
  bestSellerImageBox: {
    width: "100%",
    height: 150,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bestSellerImage: {
    width: "92%",
    height: "92%",
  },
  bestSellerName: {
    marginHorizontal: 10,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#222222",
    minHeight: 36,
  },
  bestSellerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 7,
  },
  bestSellerRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  bestSellerRatingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 2,
  },
  bestSellerPopular: {
    marginLeft: 6,
    fontSize: 10,
    color: "#777777",
  },
  bestSellerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 7,
  },
  bestSellerPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
  },
  bestSellerMrp: {
    marginLeft: 7,
    fontSize: 11,
    color: "#888888",
    textDecorationLine: "line-through",
  },

  // Info / Support / Newsletter / Footer
  infoSection: {
    marginHorizontal: 12,
    marginTop: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 13,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 13,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 10,
    color: "#444444",
    marginLeft: 7,
    fontWeight: "600",
  },
  supportSection: {
    marginHorizontal: 12,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
  },
  supportTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },
  supportText: {
    fontSize: 11,
    color: "#777777",
    marginTop: 4,
  },
  supportButton: {
    height: 40,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  supportButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  newsletter: {
    marginHorizontal: 12,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
  },
  newsletterTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },
  newsletterText: {
    fontSize: 11,
    color: "#777777",
    marginTop: 4,
    marginBottom: 11,
  },
  newsletterInputRow: {
    flexDirection: "row",
  },
  newsletterInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 7,
    paddingHorizontal: 10,
    fontSize: 11,
    color: "#222222",
  },
  subscribeButton: {
    height: 40,
    marginLeft: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    marginTop: 18,
    backgroundColor: "#222222",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: "center",
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footerDescription: {
    fontSize: 11,
    color: "#BBBBBB",
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },
  footerLink: {
    color: "#FFFFFF",
    fontSize: 11,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  copyright: {
    fontSize: 9,
    color: "#999999",
    marginTop: 14,
    textAlign: "center",
  },
  bottomNavigationSpace: {
    height: 90,
  },
});
