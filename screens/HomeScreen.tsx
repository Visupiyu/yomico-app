import React, {
  useEffect,
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
import { useNavigation } from "@react-navigation/native";
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

  const heroSlides = [
    {
      image: require("../assets/home/hero-smartphones.png"),
      category: "Mobiles",
    },
    {
      image: require("../assets/home/hero-big-deals.png"),
      category: null,
    },
    {
      image: require("../assets/home/hero-home-appliances.png"),
      category: null,
    },
    {
      image: require("../assets/home/hero-fashion.png"),
      category: "Fashion",
    },
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [defaultAddress, setDefaultAddress] = useState<any>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<any[]>([]);

  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    loadProducts();
    loadDefaultAddress();
    loadRecentlyViewed();
  }, []);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  async function loadRecentlyViewed() {
    const data = await getRecentlyViewed(8);
    setRecentlyViewedProducts(data);
  }

  async function loadDefaultAddress() {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const q = query(
        collection(db, "addresses"),
        where("userId", "==", user.uid),
        where("isDefault", "==", true)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setDefaultAddress(snapshot.docs[0].data());
      }
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
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.log("Product loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { name: "Grocery", icon: "🍎" },
    { name: "Mobiles", icon: "📱" },
    { name: "Fashion", icon: "👕" },
    { name: "Beauty", icon: "💄" },
    { name: "Furniture", icon: "🛋️" },
    { name: "Kids", icon: "👶" },
    { name: "Dairy", icon: "🥛" },
    { name: "Pharmacy", icon: "💊" },
  ];

  const trendingProducts = products.slice(0, 8);
  const bestSellerProducts = [...products]
    .sort(
      (a, b) =>
        (Number(b.rating || b.averageRating) || 0) -
        (Number(a.rating || a.averageRating) || 0)
    )
    .slice(0, 8);

  // ========== SHARED RENDER ==========
  function renderProducts(data: any[]) {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      );
    }

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

  // ========== DEALS FOR YOU (Amazon style - 4 products in one card) ==========
  function renderDealsProducts(data: any[]) {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      );
    }

    if (!data.length) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No deals available</Text>
        </View>
      );
    }

    // Group products into sets of 4
    const dealCards = [];
    for (let i = 0; i < data.length; i += 4) {
      dealCards.push(data.slice(i, i + 4));
    }

    return (
      <FlatList
        data={dealCards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => `deal-card-${index}`}
        contentContainerStyle={styles.dealsShelfList}
        renderItem={({ item: group, index }) => (
          <View style={styles.dealLargeCard}>
            {/* Header */}
            <View style={styles.dealCardHeader}>
              <Text style={styles.dealCardTitle}>Deals for you</Text>
              <Text style={styles.dealCardArrow}>›</Text>
            </View>

            {/* 2 × 2 Grid */}
            <View style={styles.dealGrid}>
              {group.map((product: any, productIndex: number) => {
                const dealLabels = [
                  "Freedom Sale Mega Deal",
                  "Freedom Sale Deal",
                  "Mega Deal",
                  "Hot Deal",
                ];
                const dealText = dealLabels[productIndex % dealLabels.length];

                return (
                  <ProductCard
                    key={product.id || `${index}-${productIndex}`}
                    product={product}
                    variant="compact"
                    dealLabel={dealText}
                  />
                );
              })}
            </View>
          </View>
        )}
      />
    );
  }

  // ========== BEST SELLERS ==========
  function renderBestSellerProducts(data: any[]) {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      );
    }

    if (!data.length) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No best sellers available</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data.slice(0, 5)}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bestSellerProductList}
        renderItem={({ item, index }) => (
          <ProductCard
            product={item}
            variant="featured"
            rankBadge={`#${index + 1} BEST SELLER`}
          />
        )}
      />
    );
  }

  function renderSection(title: string, data: any[]) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Search")}
          >
            <Text style={styles.seeAll}>See all</Text>
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
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.category}
                onPress={() =>
                  navigation.navigate("Search", { category: item.name })
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
                  slide.category
                    ? navigation.navigate("Search", { category: slide.category })
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

        {/* DEALS FOR YOU - Amazon Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Deals for You</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Search")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.countdownBanner}>
            <MaterialIcons name="bolt" size={16} color="#FFFFFF" />
            <Text style={styles.countdownText}>
              Today's deals end in {countdown}
            </Text>
          </View>

          {renderDealsProducts(products)}
        </View>

        {/* BEST SELLERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Best Sellers</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Search")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {renderBestSellerProducts(bestSellerProducts)}
        </View>

        {/* TRENDING */}
        {renderSection("Trending Products", trendingProducts)}

        {/* RECENTLY VIEWED */}
        {renderSection("Recently Viewed", recentlyViewedProducts)}

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
  loadingBox: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "#777777",
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

  // ========== DEALS FOR YOU (Amazon style) ==========
  countdownBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    marginHorizontal: 13,
    marginBottom: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  countdownText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  dealsShelfList: {
    paddingHorizontal: 12,
  },
  dealLargeCard: {
    width: Dimensions.get("window").width - 32,
    backgroundColor: "#FFF7F0",
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F5E6D8",
  },
  dealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dealCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  dealCardArrow: {
    fontSize: 26,
    color: "#333",
    fontWeight: "300",
  },
  dealGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dealProductTile: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  dealTileImageBox: {
    width: "100%",
    height: 110,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dealTileImage: {
    width: "90%",
    height: "90%",
  },
  dealTileBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#C62828",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  dealTileBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  dealTileText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C62828",
    lineHeight: 17,
  },

  // Best Sellers
  bestSellerProductList: {
    paddingHorizontal: 12,
    paddingRight: 4,
  },
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
