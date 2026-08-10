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
  Image,
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


  function openProduct(
    item: RecentlyViewedItem
  ) {

    navigation.navigate(
      "ProductDetails",
      {
        product: {

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

      <TouchableOpacity
        style={
          styles.card
        }
        activeOpacity={0.85}
        onPress={() =>
          openProduct(
            item
          )
        }
      >

        <View
          style={
            styles.imageContainer
          }
        >

          {item.image ? (

            <Image
              source={{
                uri:
                  item.image,
              }}
              style={
                styles.image
              }
              resizeMode="contain"
            />

          ) : (

            <MaterialIcons
              name="image"
              size={42}
              color="#CCCCCC"
            />

          )}

        </View>


        <View
          style={
            styles.details
          }
        >

          <Text
            style={
              styles.productName
            }
            numberOfLines={2}
          >
            {item.name ||
              "Product"}
          </Text>


          <View
            style={
              styles.priceRow
            }
          >

            <Text
              style={
                styles.price
              }
            >
              ₹{price}
            </Text>


            {mrp > price && (

              <Text
                style={
                  styles.mrp
                }
              >
                ₹{mrp}
              </Text>

            )}

          </View>


          {discount > 0 && (

            <Text
              style={
                styles.discount
              }
            >
              {discount}% OFF
            </Text>

          )}


          <Text
            style={
              styles.vendor
            }
            numberOfLines={1}
          >
            Sold by{" "}
            {item.vendorName ||
              "YOMICO Seller"}
          </Text>


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

        </View>

      </TouchableOpacity>

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


    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 10,
      marginBottom: 10,
      padding: 10,
      flexDirection:
        "row",
      borderWidth: 1,
      borderColor:
        "#EEEEEE",
    },


    imageContainer: {
      width: 105,
      height: 105,
      borderRadius: 8,
      backgroundColor:
        "#F8F8F8",
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
    },


    image: {
      width: "100%",
      height: "100%",
    },


    details: {
      flex: 1,
      marginLeft: 11,
      justifyContent:
        "center",
    },


    productName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222222",
      lineHeight: 19,
    },


    priceRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 7,
    },


    price: {
      fontSize: 17,
      fontWeight: "800",
      color: "#16A34A",
    },


    mrp: {
      fontSize: 11,
      color: "#888888",
      textDecorationLine:
        "line-through",
      marginLeft: 7,
    },


    discount: {
      fontSize: 11,
      fontWeight: "700",
      color: "#C2185B",
      marginTop: 4,
    },


    vendor: {
      fontSize: 10,
      color: "#777777",
      marginTop: 5,
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