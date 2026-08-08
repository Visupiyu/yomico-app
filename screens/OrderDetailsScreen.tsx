import React, {
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";

import { RouteProp, useRoute, useNavigation, } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../firebase/firebase";
import { addToCart } from "../services/cartService";
type OrderDetailsRouteProp =
  RouteProp<
    RootStackParamList,
    "OrderDetails"
  >;


export default function OrderDetailsScreen() {
    const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList,
        "OrderDetails"
      >
    >();
async function reorderItems() {

  try {

    for (
      const item of order.items || []
    ) {

      await addToCart({
        ...item,
        productId:
          item.productId || item.id,
        quantity:
          item.quantity || 1,
      });

    }

    Alert.alert(
      "Added to Cart",
      "Your previous order items have been added to your cart."
    );

  } catch (error) {

    console.log(
      "Reorder error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to add items to cart."
    );

  }

}
async function submitReview(
  product: any,
  rating: number,
  reviewText: string
) {

  const user =
    auth.currentUser;

  if (!user) {

    Alert.alert(
      "Login Required",
      "Please login before submitting a review."
    );

    return;

  }


  if (rating < 1) {

    Alert.alert(
      "Rating Required",
      "Please select a star rating."
    );

    return;

  }


  try {
    const existingReviewQuery =
  query(
    collection(
      db,
      "reviews"
    ),
    where(
      "orderId",
      "==",
      order.id
    ),
    where(
      "productId",
      "==",
      product.productId ||
        product.id
    ),
    where(
      "userId",
      "==",
      user.uid
    )
  );

const existingReviews =
  await getDocs(
    existingReviewQuery
  );

if (
  !existingReviews.empty
) {

  Alert.alert(
    "Already Reviewed",
    "You have already reviewed this product."
  );

  return;

}

    await addDoc(
      collection(
        db,
        "reviews"
      ),
      {

        productId:
          product.productId ||
          product.id,

        productName:
          product.name,

        vendorId:
          product.vendorId || "",

        vendorName:
          product.vendorName || "",

        orderId:
          order.id,

        userId:
          user.uid,

        customerName:
          order.customerName,

        customerEmail:
          user.email || "",

        rating:
          rating,

        review:
          reviewText.trim(),

        createdAt:
          serverTimestamp(),

      }
    );


    Alert.alert(
      "Review Submitted",
      "Thank you for reviewing this product."
    );


  } catch (error) {

    console.log(
      "Review submission error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to submit your review."
    );

  }

}
  const route =
    useRoute<OrderDetailsRouteProp>();

  const { order } =
    route.params;
const [reviewRating, setReviewRating] =
  useState(0);

const [reviewText, setReviewText] =
  useState("");

const [reviewProduct, setReviewProduct] =
  useState<any>(null);

  function formatDate(
    timestamp: any
  ) {

    if (
      !timestamp ||
      !timestamp.toDate
    ) {
      return "Date unavailable";
    }

    return timestamp
      .toDate()
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
  }
async function cancelOrder() {

  try {

    await updateDoc(
      doc(
        db,
        "orders",
        order.id
      ),
      {
        status: "Cancelled",
        paymentStatus:
          order.paymentMethod === "COD"
            ? "Pending"
            : order.paymentStatus,
      }
    );

    Alert.alert(
      "Order Cancelled",
      "Your order has been cancelled successfully."
    );

  } catch (error) {

    console.log(
      "Cancel order error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to cancel the order."
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

        {/* HEADER */}

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            Order Details
          </Text>

          <Text
            style={styles.orderId}
            numberOfLines={1}
          >
            Order #{order.id}
          </Text>

        </View>


        {/* STATUS */}

        <View
          style={styles.statusCard}
        >

          <Text
            style={styles.statusLabel}
          >
            Order Status
          </Text>

          <View
            style={styles.statusBadge}
          >

            <Text
              style={styles.statusText}
            >
              {order.status ||
                "Pending"}
            </Text>

          </View>

        </View>
{/* ORDER TRACKING */}

<View
  style={styles.section}
>

  <Text
    style={styles.sectionTitle}
  >
    Order Tracking
  </Text>


  <View style={styles.trackingRow}>

    <View style={styles.trackingLine} />

    <View style={styles.trackingItem}>

      <View
        style={
          order.status === "Pending"
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Order placed
      </Text>

    </View>


    <View style={styles.trackingItem}>

      <View
        style={
          [
            "Confirmed",
            "Packed",
            "Shipped",
            "Out for delivery",
            "Delivered",
          ].includes(order.status)
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Confirmed
      </Text>

    </View>


    <View style={styles.trackingItem}>

      <View
        style={
          [
            "Packed",
            "Shipped",
            "Out for delivery",
            "Delivered",
          ].includes(order.status)
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Packed
      </Text>

    </View>


    <View style={styles.trackingItem}>

      <View
        style={
          [
            "Shipped",
            "Out for delivery",
            "Delivered",
          ].includes(order.status)
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Shipped
      </Text>

    </View>


    <View style={styles.trackingItem}>

      <View
        style={
          [
            "Out for delivery",
            "Delivered",
          ].includes(order.status)
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Out for delivery
      </Text>

    </View>


    <View style={styles.trackingItem}>

      <View
        style={
          order.status === "Delivered"
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Delivered
      </Text>

    </View>

  </View>

</View>
{order.status === "Pending" && (

  <TouchableOpacity
    style={styles.cancelButton}
    onPress={cancelOrder}
  >

    <Text
      style={styles.cancelButtonText}
    >
      Cancel Order
    </Text>

  </TouchableOpacity>

)}
<TouchableOpacity
  style={styles.reorderButton}
  onPress={reorderItems}
>

  <Text
    style={styles.reorderButtonText}
  >
    Buy Again
  </Text>

</TouchableOpacity>
<TouchableOpacity
  style={styles.supportButton}
  activeOpacity={0.8}
  onPress={() =>
    navigation.navigate(
      "Support",
      {
        orderId:
          order.id,
      }
    )
  }
>

  <Text
    style={styles.supportButtonText}
  >
    Need Help With This Order?
  </Text>

</TouchableOpacity>
        {/* PRODUCTS */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Items
          </Text>


          {order.items?.map(
            (
              item: any,
              index: number
            ) => (

              <View
                key={
                  item.id ||
                  item.productId ||
                  index
                }
                style={styles.productRow}
              >

                {item.image ? (

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={
                      styles.productImage
                    }
                  />

                ) : (

                  <View
                    style={
                      styles.imagePlaceholder
                    }
                  >

                    <Text>
                      📦
                    </Text>

                  </View>

                )}


                <View
                  style={
                    styles.productInfo
                  }
                >

                  <Text
                    style={
                      styles.productName
                    }
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>


                  <Text
                    style={
                      styles.vendor
                    }
                  >
                    Sold by:{" "}
                    {item.vendorName ||
                      "YOMICO Seller"}
                  </Text>


                  <Text
                    style={
                      styles.quantity
                    }
                  >
                    Qty: {item.quantity}
                  </Text>

                </View>


                <Text
                  style={
                    styles.productPrice
                  }
                >
                  ₹{item.price}
                </Text>

              </View>

            )
          )}

        </View>


        {/* DELIVERY */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Delivery Address
          </Text>


          <Text
            style={styles.customerName}
          >
            {order.customerName}
          </Text>


          <Text
            style={styles.address}
          >
            {order.deliveryAddress}
          </Text>


          <Text
            style={styles.address}
          >
            {order.city} -{" "}
            {order.pincode}
          </Text>


          <Text
            style={styles.mobile}
          >
            Mobile:{" "}
            {order.customerMobile}
          </Text>

        </View>


        {/* PAYMENT */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Payment
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Payment Method
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order.paymentMethod ||
                "COD"}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Payment Status
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order.paymentStatus ||
                "Pending"}
            </Text>

          </View>

        </View>


        {/* ORDER INFORMATION */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Order Information
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Order Date
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                order.createdAt
              )}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Customer Email
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {order.customerEmail}
            </Text>

          </View>

        </View>


        {/* PRICE SUMMARY */}

        <View
          style={styles.summary}
        >

          <Text
            style={styles.sectionTitle}
          >
            Price Details
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Subtotal
            </Text>

            <Text
              style={styles.infoValue}
            >
              ₹{order.subtotal}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Shipping
            </Text>

            <Text
              style={styles.infoValue}
            >
              ₹{order.shipping}
            </Text>

          </View>


          <View
            style={styles.totalRow}
          >

            <Text
              style={styles.totalLabel}
            >
              Total
            </Text>

            <Text
              style={styles.total}
            >
              ₹{order.total}
            </Text>

          </View>

        </View>
{/* PRODUCT REVIEW */}

{order.items?.map(
  (
    item: any,
    index: number
  ) => (

    <View
      key={
        item.id ||
        item.productId ||
        index
      }
      style={styles.reviewSection}
    >

      <Text
        style={styles.sectionTitle}
      >
        Rate this product
      </Text>


      <Text
        style={styles.reviewProductName}
      >
        {item.name}
      </Text>


      {/* STARS */}

      <View
        style={styles.starsRow}
      >

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <TouchableOpacity
              key={star}
              onPress={() => {

                setReviewProduct(
                  item
                );

                setReviewRating(
                  star
                );

              }}
            >

              <Text
                style={
                  star <= reviewRating
                    ? styles.starActive
                    : styles.starInactive
                }
              >
                ★
              </Text>

            </TouchableOpacity>

          )
        )}

      </View>


      {/* REVIEW TEXT */}

      {reviewProduct?.productId ===
        (item.productId ||
          item.id) && (

        <TextInput
          style={styles.reviewInput}
          placeholder="Write your review..."
          placeholderTextColor="#999999"
          value={reviewText}
          onChangeText={
            setReviewText
          }
          multiline
          maxLength={500}
        />

      )}


      {/* SUBMIT */}

      {reviewProduct?.productId ===
        (item.productId ||
          item.id) && (

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() =>
            submitReview(
              item,
              reviewRating,
              reviewText
            )
          }
        >

          <Text
            style={
              styles.reviewButtonText
            }
          >
            Submit Review
          </Text>

        </TouchableOpacity>

      )}

    </View>

  )
)}

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


    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },


    title: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222222",
    },


    orderId: {
      fontSize: 10,
      color: "#888888",
      marginTop: 3,
    },


    statusCard: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },


    statusLabel: {
      fontSize: 13,
      color: "#555555",
      fontWeight: "600",
    },


    statusBadge: {
      backgroundColor: "#FFF4D6",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },


    statusText: {
      fontSize: 11,
      color: "#A66A00",
      fontWeight: "700",
    },


    section: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },


    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
      marginBottom: 10,
    },


    productRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },


    productImage: {
      width: 65,
      height: 65,
      borderRadius: 7,
      backgroundColor: "#F5F5F5",
    },


    imagePlaceholder: {
      width: 65,
      height: 65,
      borderRadius: 7,
      backgroundColor: "#F5F5F5",
      alignItems: "center",
      justifyContent: "center",
    },


    productInfo: {
      flex: 1,
      marginLeft: 9,
    },


    productName: {
      fontSize: 13,
      fontWeight: "700",
      color: "#222222",
      lineHeight: 17,
    },


    vendor: {
      fontSize: 10,
      color: "#777777",
      marginTop: 3,
    },


    quantity: {
      fontSize: 11,
      color: "#555555",
      marginTop: 3,
    },


    productPrice: {
      fontSize: 14,
      fontWeight: "800",
      color: "#16A34A",
      marginLeft: 5,
    },


    customerName: {
      fontSize: 13,
      fontWeight: "700",
      color: "#222222",
    },


    address: {
      fontSize: 12,
      color: "#555555",
      marginTop: 4,
      lineHeight: 17,
    },


    mobile: {
      fontSize: 11,
      color: "#666666",
      marginTop: 6,
    },


    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },


    infoLabel: {
      fontSize: 12,
      color: "#666666",
    },


    infoValue: {
      flex: 1,
      marginLeft: 12,
      textAlign: "right",
      fontSize: 12,
      color: "#333333",
      fontWeight: "600",
    },


    summary: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },


    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
      paddingTop: 9,
      marginTop: 3,
    },


    totalLabel: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222222",
    },


    total: {
      fontSize: 17,
      fontWeight: "800",
      color: "#16A34A",
    },
trackingRow: {
  position: "relative",
  paddingTop: 5,
},

trackingLine: {
  position: "absolute",
  left: 9,
  top: 14,
  bottom: 14,
  width: 2,
  backgroundColor: "#E5E5E5",
},

trackingItem: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 13,
},

trackingCircle: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: "#CCCCCC",
  backgroundColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
},

trackingCircleActive: {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: "#16A34A",
  alignItems: "center",
  justifyContent: "center",
},

trackingCheck: {
  fontSize: 11,
  color: "#FFFFFF",
  fontWeight: "800",
},

trackingTitle: {
  fontSize: 12,
  color: "#444444",
  marginLeft: 10,
  fontWeight: "600",
},
cancelButton: {
  marginTop: 7,
  marginHorizontal: 14,
  height: 44,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#E53935",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FFFFFF",
},

cancelButtonText: {
  color: "#E53935",
  fontSize: 13,
  fontWeight: "800",
},
reorderButton: {
  marginTop: 7,
  marginHorizontal: 14,
  height: 44,
  borderRadius: 8,
  backgroundColor: "#16A34A",
  alignItems: "center",
  justifyContent: "center",
},

reorderButtonText: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "800",
},
supportButton: {
  marginTop: 8,
  marginHorizontal: 14,
  height: 44,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#16A34A",
  backgroundColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
},

supportButtonText: {
  color: "#16A34A",
  fontSize: 13,
  fontWeight: "800",
},
reviewSection: {
  backgroundColor: "#FFFFFF",
  marginTop: 7,
  padding: 14,
},

reviewProductName: {
  fontSize: 13,
  fontWeight: "700",
  color: "#333333",
  marginBottom: 8,
},

starsRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 9,
},

starActive: {
  fontSize: 28,
  color: "#FFB000",
  marginRight: 5,
},

starInactive: {
  fontSize: 28,
  color: "#D5D5D5",
  marginRight: 5,
},

reviewInput: {
  minHeight: 70,
  borderWidth: 1,
  borderColor: "#DDDDDD",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 12,
  color: "#333333",
  textAlignVertical: "top",
  marginBottom: 9,
},

reviewButton: {
  height: 42,
  borderRadius: 8,
  backgroundColor: "#16A34A",
  alignItems: "center",
  justifyContent: "center",
},

reviewButtonText: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "800",
},
    bottomSpace: {
      height: 25,
    },

  });