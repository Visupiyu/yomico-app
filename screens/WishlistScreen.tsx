import React, { useEffect, useState } from "react";

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
  deleteDoc,
  doc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import { MaterialIcons } from "@expo/vector-icons";

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
    "Wishlist"
  >;


type WishlistItem = {
  id: string;
  productId?: string;
  name?: string;
  price?: number;
  mrp?: number;
  image?: string;
};


export default function WishlistScreen() {

  const navigation =
    useNavigation<NavigationProp>();


  const [wishlist, setWishlist] =
    useState<WishlistItem[]>([]);


  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    loadWishlist();

  }, []);


  async function loadWishlist() {

    const user =
      auth.currentUser;


    if (!user) {

      setWishlist([]);

      setLoading(false);

      return;

    }


    try {

      const wishlistQuery =
        query(
          collection(db, "wishlist"),
          where(
            "userId",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(
          wishlistQuery
        );


      const items =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        ) as WishlistItem[];


      setWishlist(items);

    } catch (error) {

      console.log(
        "Wishlist loading error:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  async function removeFromWishlist(
    itemId: string
  ) {

    try {

      await deleteDoc(
        doc(
          db,
          "wishlist",
          itemId
        )
      );


      setWishlist(
        (current) =>
          current.filter(
            (item) =>
              item.id !== itemId
          )
      );

    } catch (error) {

      console.log(
        "Wishlist remove error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to remove item."
      );

    }

  }


  function openProduct(
  item: WishlistItem
) {

  navigation.navigate(
    "ProductDetails",
    {
      product: item,
    }
  );

}


  function renderItem({
    item,
  }: {
    item: WishlistItem;
  }) {

    const price =
      Number(item.price || 0);


    const mrp =
      Number(item.mrp || 0);


    const discount =
      mrp > price
        ? Math.round(
            ((mrp - price) /
              mrp) *
              100
          )
        : 0;


    return (

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          openProduct(item)
        }
      >

        <View
          style={styles.imageContainer}
        >

          {item.image ? (

            <Image
              source={{
                uri: item.image,
              }}
              style={styles.image}
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
          style={styles.details}
        >

          <Text
            style={styles.productName}
            numberOfLines={2}
          >
            {item.name ||
              "Product"}
          </Text>


          <View
            style={styles.priceRow}
          >

            <Text
              style={styles.price}
            >
              ₹{price}
            </Text>


            {mrp > price && (

              <Text
                style={styles.mrp}
              >
                ₹{mrp}
              </Text>

            )}

          </View>


          {discount > 0 && (

            <Text
              style={styles.discount}
            >
              {discount}% OFF
            </Text>

          )}


          <TouchableOpacity
            style={
              styles.removeButton
            }
            activeOpacity={0.8}
            onPress={() =>
              removeFromWishlist(
                item.id
              )
            }
          >

            <MaterialIcons
              name="favorite"
              size={18}
              color="#E53935"
            />

            <Text
              style={
                styles.removeText
              }
            >
              Remove
            </Text>

          </TouchableOpacity>

        </View>

      </TouchableOpacity>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Wishlist
        </Text>


        <Text
          style={styles.count}
        >
          {wishlist.length}{" "}
          {wishlist.length === 1
            ? "item"
            : "items"}
        </Text>

      </View>


      {loading ? (

        <View
          style={
            styles.emptyContainer
          }
        >

          <Text
            style={styles.emptyText}
          >
            Loading wishlist...
          </Text>

        </View>

      ) : wishlist.length === 0 ? (

        <View
          style={
            styles.emptyContainer
          }
        >

          <MaterialIcons
            name="favorite-border"
            size={52}
            color="#BBBBBB"
          />


          <Text
            style={styles.emptyTitle}
          >
            Your Wishlist is Empty
          </Text>


          <Text
            style={styles.emptySubtitle}
          >
            Save products you love
            and find them here.
          </Text>


          <TouchableOpacity
            style={
              styles.shopButton
            }
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate(
                "Home"
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
          data={wishlist}
          keyExtractor={(item) =>
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
      backgroundColor: "#F5F5F5",
    },


    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      marginBottom: 10,
      padding: 10,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },


    imageContainer: {
      width: 105,
      height: 105,
      borderRadius: 8,
      backgroundColor: "#F8F8F8",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },


    image: {
      width: "100%",
      height: "100%",
    },


    details: {
      flex: 1,
      marginLeft: 11,
      justifyContent: "center",
    },


    productName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222222",
      lineHeight: 19,
    },


    priceRow: {
      flexDirection: "row",
      alignItems: "center",
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


    removeButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },


    removeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#E53935",
      marginLeft: 4,
    },


    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
    },


    emptyText: {
      fontSize: 12,
      color: "#777777",
    },


    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222222",
      marginTop: 12,
    },


    emptySubtitle: {
      fontSize: 12,
      color: "#777777",
      textAlign: "center",
      marginTop: 5,
    },


    shopButton: {
      marginTop: 18,
      backgroundColor: "#16A34A",
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