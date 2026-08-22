import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  getProductById,
} from "../services/productService";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useNavigation,
} from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import ListItemCard from "../components/ListItemCard";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "RecentlyViewed"
  >;


type RecentlyViewedItem = {

  id: string;

  productId?: string;

  name?: string;

  price?: number;

  mrp?: number;

  image?: string;

  vendorId?: string;

  vendorName?: string;

  discountPercent?: number;

  viewedAt?: any;

};


export default function RecentlyViewedScreen() {

  const navigation =
    useNavigation<NavigationProp>();


  const [
    products,
    setProducts,
  ] =
    useState<
      RecentlyViewedItem[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  useEffect(() => {

    loadRecentlyViewed();

  }, []);


  async function loadRecentlyViewed() {

    const user =
      auth.currentUser;


    if (!user) {

      setProducts([]);

      setLoading(false);

      return;

    }


    try {

      const recentlyViewedQuery =
        query(
          collection(
            db,
            "recentlyViewed"
          ),
          where(
            "userId",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(
          recentlyViewedQuery
        );


      const items =
        snapshot.docs.map(
          (item) => ({

            id:
              item.id,

            ...item.data(),

          })
        ) as RecentlyViewedItem[];


      /*
        Sort newest viewed products first.
      */

      items.sort(
        (
          a,
          b
        ) => {

          const dateA =
            a.viewedAt
              ?.toDate?.()
              ?.getTime?.() ||
            0;


          const dateB =
            b.viewedAt
              ?.toDate?.()
              ?.getTime?.() ||
            0;


          return (
            dateB -
            dateA
          );

        }
      );


      /*
        Show only latest 10.
      */

      setProducts(
        items.slice(0, 10)
      );

    } catch (error) {

      console.log(
        "Recently Viewed loading error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load recently viewed products."
      );

    } finally {

      setLoading(false);

    }

  }


  async function openProduct(
    item: RecentlyViewedItem
  ) {

    // The recentlyViewed doc only ever stored a display snapshot
    // (name/price/image), never stock, variants, gstPercent, or
    // category — passing that snapshot on as "the product" silently
    // disabled stock gating and the variant selector on this page,
    // and dropped GST from the order total for anything added to
    // cart from here. Fetch the live product instead; fall back to
    // the cached snapshot only if it can no longer be found.
    const liveProduct =
      item.productId
        ? await getProductById(item.productId)
        : null;

    navigation.navigate(
      "ProductDetails",
      {
        product: liveProduct || {

          id:
            item.productId,

          name:
            item.name,

          price:
            item.price,

          mrp:
            item.mrp,

          image:
            item.image,

          vendorId:
            item.vendorId,

          vendorName:
            item.vendorName,

          discountPercent:
            item.discountPercent,

        },

      }
    );

  }


  function renderItem({
    item,
  }: {
    item:
      RecentlyViewedItem;
  }) {

    const price =
      Number(
        item.price || 0
      );


    const mrp =
      Number(
        item.mrp || 0
      );


    const discount =
      mrp > price
        ? Math.round(
            (
              (mrp - price) /
              mrp
            ) * 100
          )
        : 0;


    return (

      <ListItemCard
        image={item.image || ""}
        title={item.name || "Product"}
        price={price}
        mrp={mrp}
        discountPercent={discount}
        vendor={item.vendorName || "YOMICO Seller"}
        onPress={() =>
          openProduct(
            item
          )
        }
        actions={

          <View
            style={
              styles.viewProductRow
            }
          >

            <Text
              style={
                styles.viewProductText
              }
            >
              View Product
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={16}
              color="#16A34A"
            />

          </View>

        }
      />

    );

  }


  return (

    <SafeAreaView
      style={
        styles.container
      }
    >

      <View
        style={
          styles.header
        }
      >

        <Text
          style={
            styles.title
          }
        >
          Recently Viewed
        </Text>


        <Text
          style={
            styles.count
          }
        >
          {products.length}{" "}
          {products.length === 1
            ? "product"
            : "products"}
        </Text>

      </View>


      {loading ? (

        <View
          style={
            styles.emptyContainer
          }
        >

          <Text
            style={
              styles.loadingText
            }
          >
            Loading recently viewed...
          </Text>

        </View>

      ) : products.length === 0 ? (

        <View
          style={
            styles.emptyContainer
          }
        >

          <MaterialIcons
            name="history"
            size={55}
            color="#BBBBBB"
          />


          <Text
            style={
              styles.emptyTitle
            }
          >
            No Recently Viewed Products
          </Text>


          <Text
            style={
              styles.emptySubtitle
            }
          >
            Products you view will
            appear here.
          </Text>


         <TouchableOpacity
  style={
    styles.shopButton
  }
  activeOpacity={0.8}
  onPress={() =>
    navigation.navigate(
      "MainTabs",
      {
        screen: "HomeTab",
      }
    )
  }
>

            <Text
              style={
                styles.shopButtonText
              }
            >
              Continue Shopping
            </Text>

          </TouchableOpacity>

        </View>

      ) : (

        <FlatList
          data={products}
          keyExtractor={
            (item) =>
              item.id
          }
          renderItem={
            renderItem
          }
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
        />

      )}

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


    header: {
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },


    title: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222222",
    },


    count: {
      fontSize: 11,
      color: "#777777",
      fontWeight: "600",
    },


    list: {
      padding: 10,
      paddingBottom: 25,
    },


    viewProductRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 8,
    },


    viewProductText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#16A34A",
      marginRight: 4,
    },


    emptyContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },


    loadingText: {
      fontSize: 12,
      color: "#777777",
    },


    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222222",
      marginTop: 12,
      textAlign:
        "center",
    },


    emptySubtitle: {
      fontSize: 12,
      color: "#777777",
      textAlign:
        "center",
      marginTop: 5,
    },


    shopButton: {
      marginTop: 18,
      backgroundColor:
        "#16A34A",
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 8,
    },


    shopButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },

  });