import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import {
  RouteProp,
  useRoute, useNavigation,
} from "@react-navigation/native";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import { addToCart } from "../services/cartService";
import {
  saveRecentlyViewed,
} from "../services/recentlyViewedService";
import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

type ProductDetailsRouteProp =
  RouteProp<
    RootStackParamList,
    "ProductDetails"
  >;


export default function ProductDetailsScreen() {

  const route =
    useRoute<ProductDetailsRouteProp>();

  const { product } =
    route.params;
const [reviews, setReviews] =
  useState<any[]>([]);

const [averageRating, setAverageRating] =
  useState(0);

const [reviewCount, setReviewCount] =
  useState(0);
  const navigation =
  useNavigation<
    NativeStackNavigationProp<
      RootStackParamList,
      "ProductDetails"
    >
  >();
useEffect(() => {
saveRecentlyViewed(
    product
  );
  loadReviews();
  async function loadReviews() {

  try {

    const reviewsQuery =
      query(
        collection(
          db,
          "reviews"
        ),
        where(
          "productId",
          "==",
          product.id
        )
      );

    const snapshot =
      await getDocs(
        reviewsQuery
      );

    const reviewData =
      snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data(),
        })
      );

    setReviews(
      reviewData
    );

    setReviewCount(
      reviewData.length
    );


    if (
      reviewData.length > 0
    ) {

      const totalRating =
        reviewData.reduce(
          (
            sum: number,
            item: any
          ) =>
            sum +
            Number(
              item.rating || 0
            ),
          0
        );

      setAverageRating(
        totalRating /
          reviewData.length
      );

    } else {

      setAverageRating(0);

    }

  } catch (error) {

    console.log(
      "Review loading error:",
      error
    );

  }

}

}, []);
  async function handleAddToCart() {

    try {

      await addToCart(product);

      Alert.alert(
        "Success",
        "Product added to cart."
      );

    } catch (error) {

      console.log(
        "Cart error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add product."
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


      if (!snapshot.empty) {

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
        "Success",
        "Product added to wishlist."
      );

    } catch (error) {

      console.log(
        "Wishlist error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add product to wishlist."
      );

    }

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >

        <Image
          source={{
            uri:
              product.images?.[0] ||
              product.image,
          }}
          style={styles.image}
          resizeMode="contain"
        />


        <View
          style={styles.content}
        >

          <Text
            style={styles.name}
          >
            {product.name}
          </Text>
<View style={styles.ratingRow}>

  <Text style={styles.stars}>
    {"★".repeat(
      Math.round(averageRating)
    )}
  </Text>

  <Text style={styles.ratingText}>
    {averageRating > 0
      ? averageRating.toFixed(1)
      : "No rating"}
  </Text>

  <Text style={styles.reviewCount}>
    ({reviewCount} reviews)
  </Text>

</View>
<TouchableOpacity
  style={styles.questionsButton}
  onPress={() =>
  navigation.navigate(
  "ProductQuestions",
  {
    productId: product.id,
    productName: product.name,
    vendorId: product.vendorId,
    vendorName: product.vendorName,
  }
)
  }
>
  <TouchableOpacity
  style={styles.chatButton}
  onPress={() =>
    navigation.navigate(
      "Chat",
      {
        productId:
          product.id,
        productName:
          product.name,
        vendorId:
          product.vendorId,
        vendorName:
          product.vendorName,
      }
    )
  }
>

  <MaterialIcons
    name="chat"
    size={20}
    color="#FFFFFF"
  />

  <Text
    style={styles.chatButtonText}
  >
    Chat with Seller
  </Text>

</TouchableOpacity>

  <MaterialIcons
    name="help-outline"
    size={20}
    color="#16A34A"
  />

  <Text
    style={styles.questionsButtonText}
  >
    Questions & Answers
  </Text>

</TouchableOpacity>

          <View
            style={styles.priceRow}
          >

            <Text
              style={styles.price}
            >
              ₹{product.price}
            </Text>


            {product.mrp && (

              <Text
                style={styles.mrp}
              >
                ₹{product.mrp}
              </Text>

            )}


            {product.discountPercent >
              0 && (

              <Text
                style={styles.discount}
              >
                {product.discountPercent}%
                {" "}OFF
              </Text>

            )}

          </View>


          <Text
            style={styles.stock}
          >
            Stock : {product.stock}
          </Text>


          <Text
            style={styles.vendor}
          >
            Sold by :{" "}
            {product.vendorName ||
              "YOMICO Seller"}
          </Text>


          <Text
            style={styles.heading}
          >
            Description
          </Text>
{reviews.length > 0 && (

  <View style={styles.reviewsSection}>

    <Text style={styles.heading}>
      Customer Reviews
    </Text>


    {reviews.map(
      (item: any) => (

        <View
          key={item.id}
          style={styles.reviewCard}
        >

          <View
            style={styles.reviewHeader}
          >

            <Text
              style={styles.reviewCustomer}
            >
              {item.customerName ||
                "Customer"}
            </Text>


            <Text
              style={styles.reviewStars}
            >
              {"★".repeat(
                Number(
                  item.rating || 0
                )
              )}
            </Text>

          </View>


          <Text
            style={styles.reviewText}
          >
            {item.review}
          </Text>


          <Text
            style={styles.reviewDate}
          >
            Verified customer review
          </Text>

        </View>

      )
    )}

  </View>

)}

          <Text
            style={styles.description}
          >
            {product.description ||
              "No description available."}
          </Text>


          {/* WISHLIST */}

          <TouchableOpacity
            style={
              styles.wishlistButton
            }
            onPress={
              handleAddToWishlist
            }
            activeOpacity={0.8}
          >

            <MaterialIcons
              name="favorite-border"
              size={21}
              color="#E53935"
            />

            <Text
              style={
                styles.wishlistText
              }
            >
              Add to Wishlist
            </Text>

          </TouchableOpacity>


          {/* CART */}

          <TouchableOpacity
            style={styles.cartButton}
            onPress={
              handleAddToCart
            }
            activeOpacity={0.8}
          >

            <MaterialIcons
              name="shopping-cart"
              size={21}
              color="#FFFFFF"
            />

            <Text
              style={styles.buttonText}
            >
              Add To Cart
            </Text>

          </TouchableOpacity>


          {/* BUY NOW */}

          <TouchableOpacity
            style={styles.buyButton}
            activeOpacity={0.8}
          >

            <Text
              style={styles.buttonText}
            >
              Buy Now
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>

  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },


    image: {
      width: "100%",
      height: 280,
      backgroundColor: "#FFFFFF",
    },


    content: {
      padding: 14,
    },


    name: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222222",
    },
ratingRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 7,
},

stars: {
  fontSize: 16,
  color: "#FFB000",
  fontWeight: "700",
},

ratingText: {
  fontSize: 12,
  fontWeight: "700",
  color: "#333333",
  marginLeft: 6,
},

reviewCount: {
  fontSize: 11,
  color: "#777777",
  marginLeft: 4,
},

    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },


    price: {
      fontSize: 22,
      color: "#16A34A",
      fontWeight: "800",
    },


    mrp: {
      marginLeft: 9,
      fontSize: 13,
      textDecorationLine:
        "line-through",
      color: "#777777",
    },


    discount: {
      marginLeft: 9,
      fontSize: 12,
      color: "#E53935",
      fontWeight: "700",
    },


    stock: {
      marginTop: 10,
      fontSize: 12,
      color: "#16A34A",
      fontWeight: "600",
    },


    vendor: {
      marginTop: 7,
      fontSize: 12,
      color: "#555555",
    },


    heading: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
      marginTop: 20,
    },


    description: {
      marginTop: 7,
      fontSize: 12,
      color: "#555555",
      lineHeight: 19,
    },
reviewsSection: {
  marginTop: 25,
},

reviewCard: {
  marginTop: 10,
  padding: 12,
  borderWidth: 1,
  borderColor: "#EEEEEE",
  borderRadius: 8,
  backgroundColor: "#FFFFFF",
},

reviewHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

reviewCustomer: {
  fontSize: 12,
  fontWeight: "700",
  color: "#333333",
},

reviewStars: {
  fontSize: 14,
  color: "#FFB000",
},

reviewText: {
  fontSize: 12,
  color: "#555555",
  lineHeight: 18,
  marginTop: 8,
},

reviewDate: {
  fontSize: 10,
  color: "#888888",
  marginTop: 7,
},
questionsButton: {
  marginTop: 15,
  height: 44,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#16A34A",
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

questionsButtonText: {
  marginLeft: 7,
  fontSize: 13,
  fontWeight: "800",
  color: "#16A34A",
},
chatButton: {
  marginTop: 10,
  height: 44,
  borderRadius: 8,
  backgroundColor: "#16A34A",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

chatButtonText: {
  marginLeft: 7,
  fontSize: 13,
  fontWeight: "800",
  color: "#FFFFFF",
},

    wishlistButton: {
      marginTop: 18,
      height: 44,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: "#E53935",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },


    wishlistText: {
      marginLeft: 7,
      color: "#E53935",
      fontSize: 14,
      fontWeight: "700",
    },


    cartButton: {
      marginTop: 10,
      height: 46,
      backgroundColor: "#16A34A",
      borderRadius: 9,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },


    buyButton: {
      marginTop: 10,
      height: 46,
      backgroundColor: "#FF6B00",
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },


    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
      marginLeft: 7,
    },

  });