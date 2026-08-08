import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { getProducts } from "../services/productService";

import ProductCard from "../components/ProductCard";

import { useNavigation } from "@react-navigation/native";

import {
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

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
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


  return (

    <SafeAreaView
      style={styles.container}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <Text style={styles.logo}>
            YOMICO
          </Text>

          <View
            style={styles.headerIcons}
          >

            <TouchableOpacity
              style={styles.headerIconButton}
            >
              <MaterialIcons
                name="notifications-none"
                size={24}
                color="#16A34A"
              />
            </TouchableOpacity>
<TouchableOpacity
  onPress={() =>
    navigation.navigate("Orders")
  }
  style={styles.headerIconButton}
>
  <MaterialIcons
    name="receipt-long"
    size={24}
    color="#16A34A"
  />
</TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Cart")
              }
              style={styles.headerIconButton}
            >

              <MaterialIcons
                name="shopping-cart"
                size={24}
                color="#16A34A"
              />

            </TouchableOpacity>

          </View>

        </View>


        {/* SEARCH */}

        <View
          style={styles.searchBox}
        >

          <MaterialIcons
            name="search"
            size={20}
            color="#777"
          />

          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#888"
            style={styles.searchInput}
          />

          <MaterialIcons
            name="mic-none"
            size={20}
            color="#777"
          />

        </View>


        {/* LOCATION */}

        <View
          style={styles.locationRow}
        >

          <MaterialIcons
            name="location-on"
            size={18}
            color="#16A34A"
          />

          <Text
            style={styles.location}
            numberOfLines={1}
          >
            Deliver to your location
          </Text>

          <MaterialIcons
            name="keyboard-arrow-down"
            size={18}
            color="#555"
          />

        </View>


        {/* CATEGORIES */}

        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) =>
            item.name
          }
          contentContainerStyle={
            styles.categoryList
          }
          renderItem={({
            item,
          }) => (

            <TouchableOpacity
              style={styles.category}
              activeOpacity={0.8}
            >

              <View
                style={styles.categoryIcon}
              >

                <Text
                  style={styles.categoryEmoji}
                >
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


        {/* BANNER */}

        <View style={styles.banner}>

          <View
            style={styles.bannerContent}
          >

            <Text
              style={styles.bannerSmall}
            >
              YOMICO DEALS
            </Text>

            <Text
              style={styles.bannerTitle}
            >
              Big Sale
            </Text>

            <Text
              style={styles.bannerSub}
            >
              Up to 70% OFF
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
            >

              <Text
                style={styles.shopButtonText}
              >
                Shop Now
              </Text>

            </TouchableOpacity>

          </View>

          <MaterialIcons
            name="local-offer"
            size={65}
            color="#FFFFFF"
          />

        </View>


        {/* LATEST PRODUCTS */}

        <View
          style={styles.sectionHeader}
        >

          <Text
            style={styles.sectionTitle}
          >
            Latest Products
          </Text>

          <Text
            style={styles.seeAll}
          >
            See all
          </Text>

        </View>


        {loading ? (

          <View
            style={styles.loadingBox}
          >

            <Text
              style={styles.loadingText}
            >
              Loading products...
            </Text>

          </View>

        ) : (

          <FlatList
            data={products}
            keyExtractor={(item) =>
              item.id
            }
            renderItem={({
              item,
            }) => (
              <ProductCard
                product={item}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.productList
            }
          />

        )}


        {/* SECOND SECTION */}

        <View
          style={styles.sectionHeader}
        >

          <Text
            style={styles.sectionTitle}
          >
            Deals for You
          </Text>

          <Text
            style={styles.seeAll}
          >
            See all
          </Text>

        </View>


        <View
          style={styles.dealRow}
        >

          <View
            style={styles.dealCard}
          >

            <Text
              style={styles.dealTitle}
            >
              Great Deals
            </Text>

            <Text
              style={styles.dealDiscount}
            >
              Up to 50% OFF
            </Text>

          </View>


          <View
            style={[
              styles.dealCard,
              styles.dealCardSecond,
            ]}
          >

            <Text
              style={styles.dealTitle}
            >
              Daily Savings
            </Text>

            <Text
              style={styles.dealDiscount}
            >
              From ₹99
            </Text>

          </View>

        </View>


        <View
          style={styles.bottomSpace}
        />

      </ScrollView>

    </SafeAreaView>

  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
    },


    /* HEADER */

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: "#FFFFFF",
    },


    logo: {
      fontSize: 24,
      fontWeight: "800",
      color: "#16A34A",
      letterSpacing: 0.5,
    },


    headerIcons: {
      flexDirection: "row",
      alignItems: "center",
    },


    headerIconButton: {
      marginLeft: 8,
      padding: 3,
    },


    /* SEARCH */

    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#FFFFFF",
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      paddingHorizontal: 10,
      height: 44,
    },


    searchInput: {
      flex: 1,
      height: 42,
      marginHorizontal: 7,
      fontSize: 15,
      color: "#222",
    },


    /* LOCATION */

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 14,
      marginTop: 8,
      marginBottom: 5,
    },


    location: {
      flex: 1,
      marginHorizontal: 4,
      color: "#444",
      fontSize: 13,
      fontWeight: "600",
    },


    /* CATEGORIES */

    categoryList: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },


    category: {
      width: 65,
      alignItems: "center",
      marginRight: 7,
    },


    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      elevation: 1,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },


    categoryEmoji: {
      fontSize: 23,
    },


    categoryText: {
      fontSize: 11,
      color: "#333",
      marginTop: 4,
      textAlign: "center",
    },


    /* BANNER */

    banner: {
      marginHorizontal: 12,
      marginTop: 5,
      minHeight: 120,
      borderRadius: 12,
      backgroundColor: "#16A34A",
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },


    bannerContent: {
      flex: 1,
    },


    bannerSmall: {
      color: "#DDF7E6",
      fontSize: 11,
      fontWeight: "700",
    },


    bannerTitle: {
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "800",
      marginTop: 2,
    },


    bannerSub: {
      color: "#FFFFFF",
      fontSize: 14,
      marginTop: 2,
    },


    shopButton: {
      alignSelf: "flex-start",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 7,
      marginTop: 8,
    },


    shopButtonText: {
      color: "#16A34A",
      fontSize: 12,
      fontWeight: "700",
    },


    /* SECTION */

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginHorizontal: 13,
      marginTop: 16,
      marginBottom: 5,
    },


    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222",
    },


    seeAll: {
      fontSize: 12,
      color: "#16A34A",
      fontWeight: "700",
    },


    /* PRODUCTS */

    productList: {
      paddingHorizontal: 12,
      paddingVertical: 3,
    },


    loadingBox: {
      height: 120,
      alignItems: "center",
      justifyContent: "center",
    },


    loadingText: {
      fontSize: 13,
      color: "#777",
    },


    /* DEALS */

    dealRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      gap: 8,
    },


    dealCard: {
      flex: 1,
      minHeight: 95,
      borderRadius: 10,
      backgroundColor: "#FFE5D1",
      padding: 12,
      justifyContent: "center",
    },


    dealCardSecond: {
      backgroundColor: "#E2F7E8",
    },


    dealTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#222",
    },


    dealDiscount: {
      fontSize: 13,
      color: "#16A34A",
      fontWeight: "700",
      marginTop: 5,
    },


    bottomSpace: {
      height: 30,
    },

  });