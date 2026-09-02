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
import { MaterialIcons } from "@expo/vector-icons";
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
  runTransaction,
  increment,
} from "firebase/firestore";

import {
  db,
  auth,
  storage,
} from "../firebase/firebase";
import { addToCart } from "../services/cartService";
import { getProductById } from "../services/productService";
import { createNotification } from "../services/notificationService";
import { getStatusColors } from "../utils/orderStatus";
import {
  formatPaymentMethod,
  formatPaymentStatus,
  isPayOnDelivery,
} from "../utils/paymentMethod";
import * as ImagePicker from "expo-image-picker";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
type OrderDetailsRouteProp =
  RouteProp<
    RootStackParamList,
    "OrderDetails"
  >;


function formatVariants(item: any) {
  if (!item.selectedVariants) return null;

  const parts = Object.entries(item.selectedVariants).map(
    ([label, value]) => `${label}: ${value}`
  );

  return parts.length > 0 ? parts.join(", ") : null;
}


export default function OrderDetailsScreen() {
    const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList,
        "OrderDetails"
      >
    >();
async function reorderItems() {

  // Each cart line is written with its own await inside a sequential
  // loop, so a second tap before the first pass finishes would run a
  // fully overlapping loop and double every reordered quantity.
  if (reordering) {
    return;
  }

  setReordering(true);

  try {

    for (
      const item of order.items || []
    ) {

      const productId =
        item.productId || item.id;

      // order.items is a price snapshot from when the order was
      // placed — reordering should add today's price, not whatever
      // it cost back then, matching how every other Add to Cart path
      // (Product Details, wishlist) already fetches the live product.
      // Falls back to the order's snapshot only if the product is no
      // longer available.
      const liveProduct =
        productId
          ? await getProductById(productId)
          : null;

      await addToCart({
        ...item,
        productId,
        name:
          liveProduct?.name ?? item.name,
        image:
          liveProduct?.image ?? item.image,
        price:
          liveProduct?.price ?? item.price,
        mrp:
          liveProduct?.mrp ?? item.mrp,
        discountPercent:
          liveProduct?.discountPercent ??
          item.discountPercent,
        gstPercent:
          liveProduct?.gstPercent ??
          item.gstPercent,
        vendorId:
          liveProduct?.vendorId ?? item.vendorId,
        vendorName:
          liveProduct?.vendorName ?? item.vendorName,
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

  } finally {

    setReordering(false);

  }

}
async function submitReview(
  product: any,
  rating: number,
  reviewText: string,
  photoUris: string[]
) {

  // The "already reviewed" check below is query-then-insert, not
  // atomic, and the window between them is stretched further by the
  // photo-upload loop — a second tap while photos are still uploading
  // (or before the button's disabled state visually lands) could pass
  // the duplicate check twice and create two reviews for the same
  // order/product.
  if (uploadingReview) {
    return;
  }

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

    const photoUrls: string[] = [];

    for (let i = 0; i < photoUris.length; i++) {

      const response = await fetch(photoUris[i]);
      const blob = await response.blob();

      const photoRef = ref(
        storage,
        `reviews/${user.uid}/${Date.now()}-${i}.jpg`
      );

      // blob.type from fetch(localUri).blob() is unreliable on Android
      // (often empty or "application/octet-stream"), and storage.rules'
      // isImageUnderLimit() requires contentType to match image/.* — an
      // untyped blob upload gets denied as storage/unauthorized before the
      // rule ever sees actual image bytes. Supplying it explicitly matches
      // the path's fixed .jpg extension.
      await uploadBytes(photoRef, blob, { contentType: "image/jpeg" });

      const downloadUrl = await getDownloadURL(photoRef);

      photoUrls.push(downloadUrl);

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

        photos:
          photoUrls,

        createdAt:
          serverTimestamp(),

      }
    );


    Alert.alert(
      "Review Submitted",
      "Thank you for reviewing this product."
    );

    setReviewPhotos([]);
    setReviewText("");
    setReviewRating(0);
    setReviewProduct(null);


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

  const [order, setOrder] =
    useState(route.params.order);
const [reviewRating, setReviewRating] =
  useState(0);

const [reviewText, setReviewText] =
  useState("");

const [reviewProduct, setReviewProduct] =
  useState<any>(null);

const [reviewPhotos, setReviewPhotos] =
  useState<string[]>([]);

const [uploadingReview, setUploadingReview] =
  useState(false);

const [cancelling, setCancelling] =
  useState(false);

const [reordering, setReordering] =
  useState(false);


async function pickReviewPhoto() {

  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {

    Alert.alert(
      "Permission Needed",
      "Please allow photo access to attach a picture to your review."
    );

    return;

  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
    });

  if (!result.canceled && result.assets?.[0]?.uri) {

    setReviewPhotos((current) => [
      ...current,
      result.assets[0].uri,
    ]);

  }

}


function removeReviewPhoto(index: number) {

  setReviewPhotos((current) =>
    current.filter((_, i) => i !== index)
  );

}


  // daysToAdd lets Estimated Delivery reuse this same helper/formatting —
  // same formula and en-IN shape the website's checkout/order-creation
  // routes already use (order date + 5 calendar days; see yogi/app/checkout
  // /page.tsx and yogi/app/api/place-order/route.ts's deliveryDateString()).
  function formatDate(
    timestamp: any,
    daysToAdd: number = 0
  ) {

    if (
      !timestamp ||
      !timestamp.toDate
    ) {
      return "Date unavailable";
    }

    const date = timestamp.toDate();

    if (daysToAdd) {
      date.setDate(date.getDate() + daysToAdd);
    }

    return date
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

  // The stock-restore transaction below already no-ops safely on a
  // second run (it checks status === "Cancelled" and returns), but
  // nothing stopped a double-tap from running the whole function
  // twice regardless — each successful call sends its own "Order
  // Cancelled" notification and shows its own success alert.
  if (cancelling) {
    return;
  }

  try {

    setCancelling(true);

    const updatedPaymentStatus =
      isPayOnDelivery(order.paymentMethod)
        ? "Pending"
        : order.paymentStatus;

    /*
     * Cancelling must give back the stock/sales that checkout
     * reserved for this order — otherwise a cancelled order leaves
     * the product permanently oversold-short. Mirrors the
     * reserve/rollback transaction in CheckoutScreen. Runs as one
     * transaction with the order-status update so a double-tap or a
     * second device can't restore the same stock twice.
     */

    await runTransaction(
      db,
      async (transaction) => {

        const orderRef =
          doc(db, "orders", order.id);

        const orderSnap =
          await transaction.get(orderRef);

        if (
          !orderSnap.exists() ||
          orderSnap.data().status === "Cancelled"
        ) {
          return;
        }

        const items =
          (order.items || []) as any[];

        const productRefs =
          items.map((item) =>
            doc(db, "products", item.productId || item.id)
          );

        // Firestore transactions require every get() before any
        // write, so the product docs are fetched here (a deleted
        // product must not block the cancellation itself).
        const productSnaps =
          await Promise.all(
            productRefs.map((productRef) =>
              transaction.get(productRef)
            )
          );

        for (
          let i = 0;
          i < items.length;
          i++
        ) {

          const item = items[i];

          if (
            !(item.productId || item.id) ||
            !productSnaps[i].exists()
          ) {
            continue;
          }

          transaction.update(
            productRefs[i],
            {
              stock: increment(Number(item.quantity) || 0),
              sales: increment(-(Number(item.quantity) || 0)),
            }
          );

        }

        transaction.update(orderRef, {
          status: "Cancelled",
          paymentStatus: updatedPaymentStatus,
        });

      }
    );

    setOrder({
      ...order,
      status: "Cancelled",
      paymentStatus: updatedPaymentStatus,
    });

    try {

      await createNotification({
        userId: auth.currentUser?.uid || order.userId,
        title: "Order Cancelled",
        message: "Your order has been cancelled.",
      });

    } catch (notificationError) {

      console.log(
        "Cancel notification error:",
        notificationError
      );

    }

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

  } finally {

    setCancelling(false);

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
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColors(order.status).bg },
            ]}
          >

            <Text
              style={[
                styles.statusText,
                { color: getStatusColors(order.status).text },
              ]}
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

  {/* "Delivery Failed" is a real, backend-legal status (Out For Delivery
      -> Delivery Failed -> Out For Delivery, see firestore.rules'
      isLegalOrderStatusTransition) but isn't one of the six tracker
      stages/labels. Treating it as "Out For Delivery" here — for the
      stage-activation checks only, not the labels or the Cancelled
      banner above — holds the tracker at that position instead of every
      stage past "Order placed" going blank, matching the web's own
      getStep() (yogi/lib/orderTracking.ts), which maps Delivery Failed
      to the same step as Out For Delivery for exactly this reason: a
      failed attempt doesn't erase progress already made. */}
  {(() => {
    const trackingStatus =
      order.status === "Delivery Failed"
        ? "Out For Delivery"
        : order.status;

    return (

  order.status === "Cancelled" ? (

    <View style={styles.cancelledBanner}>

      <Text style={styles.cancelledBannerText}>
        ❌ This order has been cancelled.
      </Text>

    </View>

  ) : (

  <View style={styles.trackingRow}>

    <View style={styles.trackingLine} />

    <View style={styles.trackingItem}>

      <View
        style={styles.trackingCircleActive}
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
            "Out For Delivery",
            "Delivered",
          ].includes(trackingStatus)
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
            "Out For Delivery",
            "Delivered",
          ].includes(trackingStatus)
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
            "Out For Delivery",
            "Delivered",
          ].includes(trackingStatus)
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
            "Out For Delivery",
            "Delivered",
          ].includes(trackingStatus)
            ? styles.trackingCircleActive
            : styles.trackingCircle
        }
      >
        <Text style={styles.trackingCheck}>
          ✓
        </Text>
      </View>

      <Text style={styles.trackingTitle}>
        Out For Delivery
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

  )
    );
  })()}

</View>
{order.status === "Pending" && (

  <TouchableOpacity
    style={[
      styles.cancelButton,
      cancelling && styles.cancelButtonDisabled,
    ]}
    onPress={cancelOrder}
    disabled={cancelling}
  >

    <Text
      style={styles.cancelButtonText}
    >
      {cancelling ? "Cancelling..." : "Cancel Order"}
    </Text>

  </TouchableOpacity>

)}
<TouchableOpacity
  style={[
    styles.reorderButton,
    reordering && styles.cancelButtonDisabled,
  ]}
  onPress={reorderItems}
  disabled={reordering}
>

  <Text
    style={styles.reorderButtonText}
  >
    {reordering ? "Adding..." : "Buy Again"}
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

                  {formatVariants(item) && (

                    <Text
                      style={
                        styles.itemVariant
                      }
                    >
                      {formatVariants(item)}
                    </Text>

                  )}


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
            {order.address}
          </Text>


          <Text
            style={styles.mobile}
          >
            Mobile:{" "}
            {order.phone}
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
              {formatPaymentMethod(order.paymentMethod)}
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
              {formatPaymentStatus(order.paymentStatus)}
            </Text>

          </View>

          {isPayOnDelivery(order.paymentMethod) && order.paymentAmount ? (
            <View
              style={styles.infoRow}
            >

              <Text
                style={styles.infoLabel}
              >
                Amount to Pay
              </Text>

              <Text
                style={styles.infoValue}
              >
                ₹{Number(order.paymentAmount).toLocaleString("en-IN")}
              </Text>

            </View>
          ) : null}

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
              Estimated Delivery
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                order.createdAt,
                5
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
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              GST
            </Text>

            <Text
              style={styles.infoValue}
            >
              ₹{order.gstAmount || 0}
            </Text>

          </View>


          {order.discountAmount > 0 && (

            <View
              style={styles.infoRow}
            >

              <Text
                style={styles.infoLabel}
              >
                Coupon Discount
                {order.couponCode
                  ? ` (${order.couponCode})`
                  : ""}
              </Text>

              <Text
                style={styles.infoValue}
              >
                -₹{order.discountAmount}
              </Text>

            </View>

          )}


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


      {/* REVIEW PHOTOS */}

      {reviewProduct?.productId ===
        (item.productId ||
          item.id) && (

        <View style={styles.reviewPhotoPickerRow}>

          {reviewPhotos.map((uri, index) => (

            <View key={uri} style={styles.reviewPhotoThumbBox}>

              <Image
                source={{ uri }}
                style={styles.reviewPhotoThumb}
              />

              <TouchableOpacity
                style={styles.reviewPhotoRemove}
                onPress={() => removeReviewPhoto(index)}
              >

                <MaterialIcons
                  name="close"
                  size={12}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>

          ))}

          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={pickReviewPhoto}
          >

            <MaterialIcons
              name="add-a-photo"
              size={20}
              color="#16A34A"
            />

          </TouchableOpacity>

        </View>

      )}


      {/* SUBMIT */}

      {reviewProduct?.productId ===
        (item.productId ||
          item.id) && (

        <TouchableOpacity
          style={styles.reviewButton}
          disabled={uploadingReview}
          onPress={async () => {

            setUploadingReview(true);

            await submitReview(
              item,
              reviewRating,
              reviewText,
              reviewPhotos
            );

            setUploadingReview(false);

          }}
        >

          <Text
            style={
              styles.reviewButtonText
            }
          >
            {uploadingReview ? "Submitting..." : "Submit Review"}
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


    itemVariant: {
      fontSize: 10,
      color: "#666666",
      marginTop: 3,
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

cancelledBanner: {
  backgroundColor: "#FEE2E2",
  borderRadius: 8,
  padding: 12,
},

cancelledBannerText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#DC2626",
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

cancelButtonDisabled: {
  opacity: 0.6,
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

reviewPhotoPickerRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 9,
},

reviewPhotoThumbBox: {
  width: 56,
  height: 56,
  marginRight: 8,
  marginBottom: 8,
  position: "relative",
},

reviewPhotoThumb: {
  width: 56,
  height: 56,
  borderRadius: 8,
  backgroundColor: "#F5F5F5",
},

reviewPhotoRemove: {
  position: "absolute",
  top: -5,
  right: -5,
  width: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: "#DC2626",
  alignItems: "center",
  justifyContent: "center",
},

addPhotoButton: {
  width: 56,
  height: 56,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#16A34A",
  borderStyle: "dashed",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 8,
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