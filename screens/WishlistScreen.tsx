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
import {
  addToCart,
} from "../services/cartService";
import {
  getProductById,
} from "../services/productService";

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
    "ProductDetails"
  >;


type WishlistItem = {
  id: string;
  productId?: string;
  name?: string;
  price?: number;
  mrp?: number;
  image?: string;
  discountPercent?: number;
  vendorId?: string;
  vendorName?: string;
};


export default function WishlistScreen() {

  const navigation =
    useNavigation<NavigationProp>();


  const [wishlist, setWishlist] =
    useState<WishlistItem[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [priceDrops, setPriceDrops] =
    useState<Record<string, number>>({});

  const [movingAll, setMovingAll] =
    useState(false);


  useEffect(() => {

    loadWishlist();

  }, []);


  async function loadPriceDrops(
    items: WishlistItem[]
  ) {

    const drops: Record<string, number> = {};

    await Promise.all(
      items.map(async (item) => {

        if (!item.productId) return;

        const liveProduct =
          await getProductById(item.productId);

        if (!liveProduct) return;

        const livePrice = Number((liveProduct as any).price || 0);
        const storedPrice = Number(item.price || 0);

        if (livePrice > 0 && livePrice < storedPrice) {
          drops[item.id] = storedPrice - livePrice;
        }

      })
    );

    setPriceDrops(drops);

  }


  async function moveAllToCart() {

    if (!wishlist.length) return;

    setMovingAll(true);

    try {

      for (const item of wishlist) {

        await addToCart({
          id: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          mrp: item.mrp,
          discountPercent: item.discountPercent,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
        });

        await deleteDoc(
          doc(db, "wishlist", item.id)
        );

      }

      setWishlist([]);

      Alert.alert(
        "Moved to Cart",
        "All wishlist items have been added to your cart."
      );

    } catch (error) {

      console.log(
        "Move all to cart error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to move all items to cart."
      );

    } finally {

      setMovingAll(false);

    }

  }


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

      loadPriceDrops(items);

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
async function addWishlistItemToCart(
  item: WishlistItem
) {

  try {

    await addToCart({

      id:
        item.productId,

      name:
        item.name,

      image:
        item.image,

      price:
        item.price,

      mrp:
        item.mrp,

      discountPercent:
        item.discountPercent,

      vendorId:
        item.vendorId,

      vendorName:
        item.vendorName,

    });


    Alert.alert(
      "Added to Cart",
      `${item.name || "Product"} has been added to your cart.`
    );

  } catch (error) {

    console.log(
      "Wishlist Add To Cart Error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to add product to cart."
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

          {priceDrops[item.id] > 0 && (

            <View style={styles.priceDropBadge}>

              <MaterialIcons
                name="trending-down"
                size={12}
                color="#16A34A"
              />

              <Text style={styles.priceDropText}>
                Price dropped by ₹{priceDrops[item.id]}
              </Text>

            </View>

          )}
<TouchableOpacity
  style={
    styles.addCartButton
  }
  activeOpacity={0.8}
  onPress={() =>
    addWishlistItemToCart(
      item
    )
}
>

  <MaterialIcons
    name="shopping-cart"
    size={18}
    color="#FFFFFF"
  />

  <Text
    style={
      styles.addCartText
    }
  >
    Add to Cart
  </Text>

</TouchableOpacity>

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


        <View style={styles.headerRight}>

          <Text
            style={styles.count}
          >
            {wishlist.length}{" "}
            {wishlist.length === 1
              ? "item"
              : "items"}
          </Text>

          {wishlist.length > 0 && (

            <TouchableOpacity
              style={styles.moveAllButton}
              activeOpacity={0.8}
              disabled={movingAll}
              onPress={moveAllToCart}
            >

              <Text style={styles.moveAllText}>
                {movingAll ? "Moving..." : "Move all to cart"}
              </Text>

            </TouchableOpacity>

          )}

        </View>

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
              navigation.navigate("MainTabs", {
                screen: "HomeTab",
              })
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


    headerRight: {
      alignItems: "flex-end",
    },


    moveAllButton: {
      marginTop: 6,
    },


    moveAllText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#16A34A",
    },


    priceDropBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },


    priceDropText: {
      marginLeft: 3,
      fontSize: 10,
      fontWeight: "700",
      color: "#16A34A",
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
addCartButton: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#16A34A",
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 7,
  marginTop: 9,
},

addCartText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
  marginLeft: 5,
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