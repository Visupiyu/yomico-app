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


type ProductProps = {
  product: any;
};


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "Home"
  >;


export default function ProductCard({
  product,
}: ProductProps) {

  const navigation =
    useNavigation<NavigationProp>();


  async function handleAddToCart() {

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


  return (

    <TouchableOpacity
      style={
        styles.card
      }
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate(
          "ProductDetails",
          {
            product,
          }
        )
      }
    >

      <Image
        source={{
          uri:
            product.images?.[0] ||
            product.image,
        }}
        style={
          styles.image
        }
        resizeMode="cover"
      />


      <Text
        style={
          styles.name
        }
        numberOfLines={2}
      >
        {product.name}
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
          ₹{product.price}
        </Text>


        {product.mrp ? (

          <Text
            style={
              styles.mrp
            }
          >
            ₹{product.mrp}
          </Text>

        ) : null}

      </View>


      {product.discountPercent ? (

        <Text
          style={
            styles.discount
          }
        >
          {product.discountPercent}%
          {" "}OFF
        </Text>

      ) : null}


      <View
        style={
          styles.bottomRow
        }
      >

        {/* WISHLIST */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={
            handleAddToWishlist
          }
        >

          <MaterialIcons
            name="favorite-border"
            size={19}
            color="#E53935"
          />

        </TouchableOpacity>


        {/* CART */}

        <TouchableOpacity
          style={
            styles.cartButton
          }
          activeOpacity={0.7}
          onPress={
            handleAddToCart
          }
        >

          <MaterialIcons
            name="shopping-cart"
            size={16}
            color="#FFFFFF"
          />

        </TouchableOpacity>

      </View>

    </TouchableOpacity>

  );

}


const styles =
  StyleSheet.create({

    card: {
      width: 135,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 9,
      padding: 6,
      marginRight: 7,
      marginVertical: 3,
      elevation: 2,
    },


    image: {
      width: "100%",
      height: 100,
      borderRadius: 7,
      backgroundColor:
        "#F5F5F5",
    },


    name: {
      fontSize: 11,
      fontWeight: "600",
      marginTop: 5,
      minHeight: 30,
      color: "#222",
    },


    priceRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 4,
    },


    price: {
      fontSize: 14,
      fontWeight: "700",
      color: "#16A34A",
    },


    mrp: {
      marginLeft: 5,
      fontSize: 10,
      textDecorationLine:
        "line-through",
      color: "#888",
    },


    discount: {
      color: "#C2185B",
      fontSize: 10,
      marginTop: 3,
      fontWeight: "700",
    },


    bottomRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginTop: 6,
      alignItems:
        "center",
    },


    cartButton: {
      backgroundColor:
        "#16A34A",
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 6,
    },

  });