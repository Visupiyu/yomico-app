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
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  getProducts,
} from "../services/productService";

import ProductCard from "../components/ProductCard";

import {
  useNavigation,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "Home"
  >;


export default function HomeScreen() {

  const navigation =
    useNavigation<NavigationProp>();
const heroRef = useRef<ScrollView>(null);

const [heroIndex, setHeroIndex] = useState(0);

const heroSlides = [
  require("../assets/home/hero-smartphones.png"),
  require("../assets/home/hero-big-deals.png"),
  require("../assets/home/hero-home-appliances.png"),
  require("../assets/home/hero-fashion.png"),
];

  const [
    products,
    setProducts,
  ] =
    useState<any[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  useEffect(() => {

    loadProducts();

  }, []);


  async function loadProducts() {

    try {

      const data =
        await getProducts();

      setProducts(data);

    } catch (error) {

      console.log(
        "Product loading error:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  const categories = [

    {
      name: "Grocery",
      icon: "🍎",
    },

    {
      name: "Mobiles",
      icon: "📱",
    },

    {
      name: "Fashion",
      icon: "👕",
    },

    {
      name: "Beauty",
      icon: "💄",
    },

    {
      name: "Furniture",
      icon: "🛋️",
    },

    {
      name: "Kids",
      icon: "👶",
    },

    {
      name: "Dairy",
      icon: "🥛",
    },

    {
      name: "Pharmacy",
      icon: "💊",
    },

  ];


  const trendingProducts =
    products.slice(
      0,
      8
    );


  const bestSellerProducts =
    [...products]
      .sort(
        (a, b) =>
          (b.sales || 0) -
          (a.sales || 0)
      )
      .slice(
        0,
        8
      );


  const recommendedProducts =
    products.slice(
      0,
      8
    );


  const recentlyViewedProducts =
    products.slice(
      0,
      8
    );


  function renderProducts(
    data: any[]
  ) {

    if (loading) {

      return (

        <View
          style={
            styles.loadingBox
          }
        >

          <Text
            style={
              styles.loadingText
            }
          >
            Loading products...
          </Text>

        </View>

      );

    }


    if (!data.length) {

      return (

        <View
          style={
            styles.emptyBox
          }
        >

          <Text
            style={
              styles.emptyText
            }
          >
            No products available
          </Text>

        </View>

      );

    }


    return (

      <FlatList
        data={data}
        horizontal
        keyExtractor={
          (item) =>
            item.id
        }
        renderItem={({
          item,
        }) => (

          <ProductCard
            product={item}
          />

        )}
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.productList
        }
      />

    );

  }


  function renderSection(
    title: string,
    data: any[]
  ) {

    return (

      <View
        style={
          styles.section
        }
      >

        <View
          style={
            styles.sectionHeader
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            {title}
          </Text>


          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(
                "Search"
              )
            }
          >

            <Text
              style={
                styles.seeAll
              }
            >
              See all
            </Text>

          </TouchableOpacity>

        </View>


        {renderProducts(
          data
        )}

      </View>

    );

  }


  return (

    <SafeAreaView
      style={
        styles.container
      }
    >

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

      {/* =========================
    YOMICO TOP HEADER
========================== */}

<View style={styles.topHeader}>

  <View style={styles.brandBlock}>

    <Text style={styles.brandLogo}>
      YOMICO
    </Text>

    <Text style={styles.brandTagline}>
      India's Multi-Vendor Marketplace
    </Text>

  </View>

</View>


{/* =========================
    SEARCH
========================== */}

<TouchableOpacity
  activeOpacity={0.85}
  onPress={() =>
    navigation.navigate("Search")
  }
>
  <View style={styles.searchBox}>

    <MaterialIcons
      name="search"
      size={24}
      color="#263238"
    />

    <Text
      style={styles.searchPlaceholder}
    >
      Search on YOMICO...
    </Text>

    <MaterialIcons
      name="mic-none"
      size={22}
      color="#263238"
    />

  </View>
</TouchableOpacity>


{/* =========================
    DELIVERY LOCATION
========================== */}

<TouchableOpacity
  activeOpacity={0.8}
  style={styles.deliveryBar}
>
  <MaterialIcons
    name="location-on"
    size={21}
    color="#16A34A"
  />

  <View style={styles.deliveryContent}>

    <Text style={styles.deliveryLabel}>
      Deliver to
    </Text>

    <Text
      style={styles.deliveryAddress}
      numberOfLines={1}
    >
      Select your delivery location
    </Text>

  </View>

  <MaterialIcons
    name="keyboard-arrow-right"
    size={22}
    color="#555"
  />

</TouchableOpacity>


{/* =========================
    CATEGORIES
========================== */}

<View style={styles.categorySection}>

  <View style={styles.sectionHeader}>

    <Text style={styles.sectionTitle}>
      Shop by Category
    </Text>

    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate("Search")
      }
    >
      <Text style={styles.seeAll}>
        View All →
      </Text>
    </TouchableOpacity>

  </View>


  <FlatList
    data={categories}
    horizontal
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item) => item.name}
    contentContainerStyle={
      styles.categoryList
    }
    renderItem={({ item }) => (

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.category}
        onPress={() =>
          navigation.navigate(
            "Search",
            {
              category: item.name,
            }
          )
        }
      >

        <View style={styles.categoryIcon}>

          <Text style={styles.categoryEmoji}>
            {item.icon}
          </Text>

        </View>

        <Text
          style={styles.categoryText}
          numberOfLines={1}
        >
          {item.name}
        </Text>

      </TouchableOpacity>

    )}
  />

</View>

{/* =========================
    YOMICO HERO CAROUSEL
========================== */}

<View style={styles.heroCarousel}>

  <ScrollView
    ref={heroRef}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    onMomentumScrollEnd={(event) => {

      const index =
        Math.round(
          event.nativeEvent.contentOffset.x /
          event.nativeEvent.layoutMeasurement.width
        );

      setHeroIndex(index);

    }}
  >

    {heroSlides.map(
      (image, index) => (

        <TouchableOpacity
          key={index}
          activeOpacity={0.95}
          style={styles.heroSlide}
          onPress={() =>
            navigation.navigate("Search")
          }
        >

          <Image
            source={image}
            style={styles.heroImage}
            resizeMode="cover"
          />

        </TouchableOpacity>

      )
    )}

  </ScrollView>


  {/* HERO DOTS */}

  <View
    style={styles.heroDotsOverlay}
  >

    {heroSlides.map(
      (_, index) => (

        <View
          key={index}
          style={
            index === heroIndex
              ? styles.heroDotActive
              : styles.heroDot
          }
        />

      )
    )}

  </View>

</View>

        {/* =========================
            DEALS
        ========================== */}

        {renderSection(
          "Deals for You",
          products
        )}


        {/* =========================
            TRENDING
        ========================== */}

        {renderSection(
          "Trending Products",
          trendingProducts
        )}


        {/* =========================
            BEST SELLERS
        ========================== */}

        {renderSection(
          "Best Sellers",
          bestSellerProducts
        )}


        {/* =========================
            RECOMMENDED
        ========================== */}

        {renderSection(
          "Recommended for You",
          recommendedProducts
        )}


        {/* =========================
            RECENTLY VIEWED
        ========================== */}

        {renderSection(
          "Recently Viewed",
          recentlyViewedProducts
        )}


        {/* =========================
            WHY SHOP YOMICO
        ========================== */}

        <View
          style={
            styles.infoSection
          }
        >

          <Text
            style={
              styles.infoTitle
            }
          >
            Why Shop YOMICO?
          </Text>


          <View
            style={
              styles.infoRow
            }
          >

            <View
              style={
                styles.infoItem
              }
            >

              <MaterialIcons
                name="verified-user"
                size={24}
                color="#16A34A"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                Trusted Sellers
              </Text>

            </View>


            <View
              style={
                styles.infoItem
              }
            >

              <MaterialIcons
                name="lock"
                size={24}
                color="#16A34A"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                Secure Payments
              </Text>

            </View>

          </View>


          <View
            style={
              styles.infoRow
            }
          >

            <View
              style={
                styles.infoItem
              }
            >

              <MaterialIcons
                name="support-agent"
                size={24}
                color="#16A34A"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                Easy Support
              </Text>

            </View>


            <View
              style={
                styles.infoItem
              }
            >

              <MaterialIcons
                name="local-shipping"
                size={24}
                color="#16A34A"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                Reliable Delivery
              </Text>

            </View>

          </View>

        </View>


        {/* =========================
            SUPPORT
        ========================== */}

        <View
          style={
            styles.supportSection
          }
        >

          <Text
            style={
              styles.supportTitle
            }
          >
            Need Help?
          </Text>


          <Text
            style={
              styles.supportText
            }
          >
            Our support team is here to help you.
          </Text>


          <TouchableOpacity
            style={
              styles.supportButton
            }
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate(
                "Support"
              )
            }
          >

            <Text
              style={
                styles.supportButtonText
              }
            >
              Help & Support
            </Text>

          </TouchableOpacity>

        </View>


        {/* =========================
            NEWSLETTER
        ========================== */}

        <View
          style={
            styles.newsletter
          }
        >

          <Text
            style={
              styles.newsletterTitle
            }
          >
            Stay Updated
          </Text>


          <Text
            style={
              styles.newsletterText
            }
          >
            Get updates about new products and offers.
          </Text>


          <View
            style={
              styles.newsletterInputRow
            }
          >

            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#888888"
              style={
                styles.newsletterInput
              }
            />


            <TouchableOpacity
              style={
                styles.subscribeButton
              }
              activeOpacity={0.8}
            >

              <Text
                style={
                  styles.subscribeText
                }
              >
                Subscribe
              </Text>

            </TouchableOpacity>

          </View>

        </View>


        {/* =========================
            FOOTER
        ========================== */}

        <View
          style={
            styles.footer
          }
        >

          <Text
            style={
              styles.footerLogo
            }
          >
            YOMICO
          </Text>


          <Text
            style={
              styles.footerDescription
            }
          >
            Your everyday marketplace.
          </Text>


          <View
            style={
              styles.footerLinks
            }
          >

            <TouchableOpacity>
              <Text
                style={
                  styles.footerLink
                }
              >
                About
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  "Support"
                )
              }
            >
              <Text
                style={
                  styles.footerLink
                }
              >
                Support
              </Text>
            </TouchableOpacity>


            <TouchableOpacity>
              <Text
                style={
                  styles.footerLink
                }
              >
                Privacy
              </Text>
            </TouchableOpacity>


            <TouchableOpacity>
              <Text
                style={
                  styles.footerLink
                }
              >
                Terms
              </Text>
            </TouchableOpacity>

          </View>


          <Text
            style={
              styles.copyright
            }
          >
            © 2026 YOMICO. All rights reserved.
          </Text>

        </View>


        {/* =========================
            BOTTOM NAVIGATION SPACE
        ========================== */}

        <View
          style={
            styles.bottomNavigationSpace
          }
        />

      </ScrollView>

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#F5F5F5",
    },


    scrollContent: {
      paddingBottom: 20,
    },


    /* HEADER */
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
  color: "#078A3D",
},
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
  color: "#078A3D",
  letterSpacing: 1,
},

brandTagline: {
  fontSize: 10,
  color: "#496454",
  marginTop: 2,
},

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
  shadowOffset: {
    width: 0,
    height: 2,
  },
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
  shadowOffset: {
    width: 0,
    height: 2,
  },
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


    /* HERO */

heroCarousel: {
  marginHorizontal: 13,
  marginTop: 16,
  borderRadius: 16,
  overflow: "hidden",
  backgroundColor: "#FFFFFF",
  position: "relative",
},

heroSlide: {
  width:
    Dimensions.get("window").width - 26,
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
  backgroundColor: "#078A3D",
  marginHorizontal: 3,
},

heroDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#FFFFFF",
  marginHorizontal: 3,
},

    /* PRODUCTS */

    productList: {
      paddingHorizontal: 12,
    },


    loadingBox: {
      height: 150,
      alignItems:
        "center",
      justifyContent:
        "center",
    },


    loadingText: {
      fontSize: 12,
      color: "#777777",
    },


    emptyBox: {
      height: 100,
      alignItems:
        "center",
      justifyContent:
        "center",
    },


    emptyText: {
      fontSize: 12,
      color: "#777777",
    },


    /* INFO */

    infoSection: {
      marginHorizontal: 12,
      marginTop: 22,
      backgroundColor:
        "#FFFFFF",
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
      flexDirection:
        "row",
      marginBottom: 13,
    },


    infoItem: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
    },


    infoText: {
      fontSize: 10,
      color: "#444444",
      marginLeft: 7,
      fontWeight: "600",
    },


    /* SUPPORT */

    supportSection: {
      marginHorizontal: 12,
      marginTop: 14,
      backgroundColor:
        "#FFFFFF",
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
      borderColor:
        "#16A34A",
      alignItems:
        "center",
      justifyContent:
        "center",
    },


    supportButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#16A34A",
    },


    /* NEWSLETTER */

    newsletter: {
      marginHorizontal: 12,
      marginTop: 14,
      backgroundColor:
        "#FFFFFF",
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
      flexDirection:
        "row",
    },


    newsletterInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor:
        "#DDDDDD",
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
      backgroundColor:
        "#16A34A",
      alignItems:
        "center",
      justifyContent:
        "center",
    },


    subscribeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },


    /* FOOTER */

    footer: {
      marginTop: 18,
      backgroundColor:
        "#222222",
      paddingHorizontal: 16,
      paddingTop: 22,
      paddingBottom: 20,
      alignItems:
        "center",
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
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "center",
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
      textAlign:
        "center",
    },


    /* BOTTOM NAVIGATION */

    bottomNavigationSpace: {
      height: 90,
    },

  });