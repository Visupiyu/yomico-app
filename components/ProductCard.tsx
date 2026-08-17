import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";

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
  addDoc,
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
  addToCart,
} from "../services/cartService";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type ProductCardVariant =
  | "grid"
  | "featured"
  | "compact";


type ProductProps = {
  product: any;
  // Optional — defaults to "grid", which is the existing appearance/
  // behavior unchanged. "featured" and "compact" are prepared here for
  // the Best Sellers / Deals for You migrations, done as a later step.
  variant?: ProductCardVariant;
  // Optional — only rendered when provided, e.g. "#1 BEST SELLER".
  rankBadge?: string;
  // Optional — only rendered when provided, e.g. "Hot Deal".
  dealLabel?: string;
};


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "MainTabs"
  >;


export default function ProductCard({
  product,
  variant = "grid",
  rankBadge,
  dealLabel,
}: ProductProps) {

  const navigation =
    useNavigation<NavigationProp>();


  async function handleAddToCart() {

    if (!auth.currentUser) {

      Alert.alert(
        "Login Required",
        "Please login to add products to your cart."
      );

      return;

    }

    try {

      await addToCart(
        product
      );

      Alert.alert(
        "Added to Cart",
        `${product.name || "Product"} has been added to your cart.`
      );

    } catch (error) {

      console.log(
        "Product Card Cart Error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add product to cart."
      );

    }

  }


  async function handleAddToWishlist() {

    const user =
      auth.currentUser;


    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login to add products to your wishlist."
      );

      return;

    }


    try {

      const wishlistQuery =
        query(
          collection(
            db,
            "wishlist"
          ),

          where(
            "userId",
            "==",
            user.uid
          ),

          where(
            "productId",
            "==",
            product.id
          )
        );


      const snapshot =
        await getDocs(
          wishlistQuery
        );


      if (
        !snapshot.empty
      ) {

        Alert.alert(
          "Already Added",
          "This product is already in your wishlist."
        );

        return;

      }


      await addDoc(
        collection(
          db,
          "wishlist"
        ),

        {

          userId:
            user.uid,

          productId:
            product.id,

          name:
            product.name || "",

          price:
            product.price || 0,

          mrp:
            product.mrp || 0,

          image:
            product.images?.[0] ||
            product.image ||
            "",

          vendorId:
            product.vendorId || "",

          vendorName:
            product.vendorName || "",

          discountPercent:
            product.discountPercent || 0,

          createdAt:
            new Date(),

        }
      );


      Alert.alert(
        "Added to Wishlist",
        `${product.name || "Product"} has been added to your wishlist.`
      );

    } catch (error) {

      console.log(
        "Product Card Wishlist Error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add product to wishlist."
      );

    }

  }


  const imageSource =
    product.images?.[0] ||
    product.image ||
    "";


  const price =
    Number(product.price || 0);


  const mrp =
    Number(product.mrp || 0);


  const discount =
    Number(
      product.discountPercent || 0
    );


  const rating =
    Number(
      product.rating ||
      product.averageRating ||
      0
    );


  return (

    <TouchableOpacity
      style={[
        styles.card,
        variant === "compact" &&
          styles.cardCompact,
      ]}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate(
          "ProductDetails",
          {
            product,
          }
        )
      }
    >

      {/* RANK BADGE (featured variant) */}

      {rankBadge ? (

        <View
          style={
            styles.rankBadge
          }
        >

          <Text
            style={
              styles.rankBadgeText
            }
          >
            {rankBadge}
          </Text>

        </View>

      ) : null}


      {/* IMAGE AREA */}

      <View
        style={
          styles.imageBox
        }
      >

        <Image
          source={{
            uri:
              imageSource,
          }}
          style={
            styles.image
          }
          resizeMode="contain"
        />


        {/* DISCOUNT */}

        {discount > 0 ? (

          <View
            style={
              styles.discountBadge
            }
          >

            <Text
              style={
                styles.discountBadgeText
              }
            >
              {discount}% OFF
            </Text>

          </View>

        ) : null}


        {/* WISHLIST */}

        <TouchableOpacity
          style={
            styles.wishlistButton
          }
          activeOpacity={0.75}
          onPress={
            handleAddToWishlist
          }
        >

          <MaterialIcons
            name="favorite-border"
            size={19}
            color="#333333"
          />

        </TouchableOpacity>

      </View>


      {/* PRODUCT INFORMATION */}

      <View
        style={
          styles.content
        }
      >

        <Text
          style={
            styles.name
          }
          numberOfLines={2}
        >
          {product.name ||
            "Product"}
        </Text>


        {/* DEAL LABEL (compact variant) */}

        {dealLabel ? (

          <Text
            style={
              styles.dealLabel
            }
            numberOfLines={2}
          >
            {dealLabel}
          </Text>

        ) : null}


        {/* RATING */}

        {rating > 0 ? (

          <View
            style={
              styles.ratingRow
            }
          >

            <View
              style={
                styles.ratingBox
              }
            >

              <Text
                style={
                  styles.ratingText
                }
              >
                {rating.toFixed(1)}
              </Text>

              <MaterialIcons
                name="star"
                size={11}
                color="#FFFFFF"
              />

            </View>

            <Text
              style={
                styles.ratingLabel
              }
            >
              Rated
            </Text>

          </View>

        ) : null}


        {/* PRICE */}

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
            ₹{price.toLocaleString("en-IN")}
          </Text>


          {mrp > price ? (

            <Text
              style={
                styles.mrp
              }
            >
              ₹{mrp.toLocaleString("en-IN")}
            </Text>

          ) : null}

        </View>


        {/* DISCOUNT */}

        {discount > 0 ? (

          <Text
            style={
              styles.discount
            }
          >
            {discount}% off
          </Text>

        ) : null}


        {/* BOTTOM ACTIONS */}

        <View
          style={
            styles.bottomRow
          }
        >

          <Text
            style={
              styles.viewText
            }
          >
            View details
          </Text>


          <TouchableOpacity
            style={
              styles.cartButton
            }
            activeOpacity={0.8}
            onPress={
              handleAddToCart
            }
          >

            <MaterialIcons
              name="add-shopping-cart"
              size={15}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.cartButtonText
              }
            >
              Add
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </TouchableOpacity>

  );

}


const styles =
  StyleSheet.create({

    card: {
      width: 158,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 13,
      marginRight: 10,
      marginVertical: 5,
      overflow: "hidden",

      elevation: 3,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.08,

      shadowRadius: 5,
    },


    // Narrower footprint for dense grids (e.g. Deals for You).
    // Only applied when variant="compact" — default "grid" card
    // above is untouched.
    cardCompact: {
      width: 140,
    },


    imageBox: {
      height: 142,
      backgroundColor:
        "#F7F9F8",
      position:
        "relative",
      alignItems:
        "center",
      justifyContent:
        "center",
    },


    image: {
      width: "88%",
      height: "88%",
    },


    discountBadge: {
      position:
        "absolute",
      left: 8,
      top: 8,
      backgroundColor:
        "#16A34A",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 5,
    },


    discountBadgeText: {
      color:
        "#FFFFFF",
      fontSize: 9,
      fontWeight:
        "800",
    },


    // "#N BEST SELLER" style badge — only rendered when the
    // rankBadge prop is provided (featured variant).
    rankBadge: {
      alignSelf:
        "flex-start",
      marginTop: 8,
      marginLeft: 9,
      backgroundColor:
        "#FFF3D6",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 5,
    },


    rankBadgeText: {
      color:
        "#A16207",
      fontSize: 9,
      fontWeight:
        "800",
    },


    // Marketing label (e.g. "Hot Deal") — only rendered when the
    // dealLabel prop is provided (compact variant).
    dealLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight:
        "700",
      color:
        "#E53935",
      lineHeight: 15,
    },


    wishlistButton: {
      position:
        "absolute",
      right: 8,
      top: 8,
      width: 31,
      height: 31,
      borderRadius: 16,
      backgroundColor:
        "#FFFFFF",
      alignItems:
        "center",
      justifyContent:
        "center",

      elevation: 2,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity:
        0.12,

      shadowRadius: 3,
    },


    content: {
      paddingHorizontal: 9,
      paddingTop: 8,
      paddingBottom: 9,
    },


    name: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight:
        "600",
      color:
        "#202020",
      minHeight: 34,
    },


    ratingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 5,
    },


    ratingBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#16A34A",
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: 4,
    },


    ratingText: {
      color:
        "#FFFFFF",
      fontSize: 9,
      fontWeight:
        "800",
      marginRight: 2,
    },


    ratingLabel: {
      marginLeft: 5,
      fontSize: 9,
      color:
        "#777777",
    },


    priceRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 6,
    },


    price: {
      fontSize: 16,
      fontWeight:
        "900",
      color:
        "#111111",
    },


    mrp: {
      marginLeft: 6,
      fontSize: 10,
      color:
        "#888888",
      textDecorationLine:
        "line-through",
    },


    discount: {
      marginTop: 2,
      fontSize: 10,
      fontWeight:
        "700",
      color:
        "#16A34A",
    },


    bottomRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginTop: 8,
    },


    viewText: {
      fontSize: 9,
      color:
        "#777777",
      fontWeight:
        "600",
    },


    cartButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#16A34A",
      minWidth: 57,
      height: 29,
      paddingHorizontal: 8,
      borderRadius: 7,
    },


    cartButtonText: {
      marginLeft: 4,
      color:
        "#FFFFFF",
      fontSize: 10,
      fontWeight:
        "800",
    },

  });