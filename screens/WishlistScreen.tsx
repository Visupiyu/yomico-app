import React, { useCallback, useState } from "react";

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

import ListItemCard from "../components/ListItemCard";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

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

  // Wishlist docs don't store stock (it wasn't known when the item
  // was saved), so out-of-stock is only knowable from the live
  // product — fetched below alongside the price-drop check.
  const [outOfStockItems, setOutOfStockItems] =
    useState<Record<string, boolean>>({});

  const [movingAll, setMovingAll] =
    useState(false);


  useFocusEffect(
    useCallback(() => {

      loadWishlist();

    }, [])
  );


  async function loadPriceDrops(
    items: WishlistItem[]
  ) {

    const drops: Record<string, number> = {};
    const outOfStock: Record<string, boolean> = {};

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

        const liveStock = (liveProduct as any).stock;

        if (liveStock !== undefined && Number(liveStock) <= 0) {
          outOfStock[item.id] = true;
        }

      })
    );

    setPriceDrops(drops);
    setOutOfStockItems(outOfStock);

  }


  // The wishlist doc only stores a price snapshot from when the item
  // was saved — this screen's own "Price dropped" banner proves that
  // price can have changed since. Fetch the live product so Add to
  // Cart uses today's price, not the stale one, matching how every
  // other Add to Cart path (Product Details, Product Card) already
  // works. Falls back to the wishlist snapshot only if the product is
  // no longer available.
  async function buildCartPayload(item: WishlistItem) {

    const liveProduct =
      item.productId
        ? await getProductById(item.productId)
        : null;

    return {
      id: item.productId,
      name: liveProduct?.name ?? item.name,
      image: liveProduct?.image ?? item.image,
      price: liveProduct?.price ?? item.price,
      mrp: liveProduct?.mrp ?? item.mrp,
      discountPercent:
        liveProduct?.discountPercent ?? item.discountPercent,
      gstPercent: liveProduct?.gstPercent,
      vendorId: liveProduct?.vendorId ?? item.vendorId,
      vendorName: liveProduct?.vendorName ?? item.vendorName,
    };

  }


  async function moveAllToCart() {

    if (!wishlist.length) return;

    setMovingAll(true);

    try {

      const inStockItems =
        wishlist.filter((item) => !outOfStockItems[item.id]);

      for (const item of inStockItems) {

        await addToCart(
          await buildCartPayload(item)
        );

        await deleteDoc(
          doc(db, "wishlist", item.id)
        );

      }

      setWishlist((current) =>
        current.filter((item) => outOfStockItems[item.id])
      );

      const skippedCount =
        wishlist.length - inStockItems.length;

      Alert.alert(
        "Moved to Cart",
        skippedCount > 0
          ? `${inStockItems.length} item${inStockItems.length === 1 ? "" : "s"} added to your cart. ${skippedCount} out-of-stock item${skippedCount === 1 ? "" : "s"} left in your wishlist.`
          : "All wishlist items have been added to your cart."
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

  if (outOfStockItems[item.id]) {

    Alert.alert(
      "Out of Stock",
      "This product is currently out of stock."
    );

    return;

  }

  try {

    await addToCart(
      await buildCartPayload(item)
    );


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

  async function openProduct(
  item: WishlistItem
) {

  // `item` is the wishlist doc, not the product — its own `id` is the
  // wishlist doc id, not the product id. Passing it straight through
  // as `product` used to corrupt everything downstream (reviews,
  // recently-viewed, and critically Add to Cart, which would store
  // the wishlist doc id as the cart line's productId and make the
  // item unbuyable at checkout). Fetch the real, live product by
  // `item.productId` instead; fall back to a correctly-mapped partial
  // object only if the product can no longer be found.
  const liveProduct =
    item.productId
      ? await getProductById(item.productId)
      : null;

  navigation.navigate(
    "ProductDetails",
    {
      product: liveProduct || {
        id: item.productId,
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        discountPercent: item.discountPercent,
      },
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

      <ListItemCard
        image={item.image || ""}
        title={item.name || ""}
        price={price}
        mrp={mrp}
        discountPercent={discount}
        onPress={() =>
          openProduct(item)
        }
        actions={

          <>

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

            {outOfStockItems[item.id] && (

              <Text style={styles.outOfStockText}>
                Out of Stock
              </Text>

            )}

            <TouchableOpacity
              style={[
                styles.addCartButton,
                outOfStockItems[item.id] &&
                  styles.addCartButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!!outOfStockItems[item.id]}
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

          </>

        }
      />

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

addCartButtonDisabled: {
  backgroundColor: "#B5B5B5",
},

outOfStockText: {
  marginTop: 8,
  fontSize: 11,
  fontWeight: "700",
  color: "#DC2626",
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