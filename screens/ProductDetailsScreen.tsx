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
  Modal,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
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
  getProductsByCategory,
} from "../services/productService";
import ProductCard from "../components/ProductCard";
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
    const productImages =
  Array.isArray(product.images) &&
  product.images.length > 0
    ? product.images.slice(0, 5)
    : product.image
      ? [product.image]
      : [];

const [selectedImage, setSelectedImage] =
  useState(0);

const [zoomVisible, setZoomVisible] =
  useState(false);
const [reviews, setReviews] =
  useState<any[]>([]);

const [averageRating, setAverageRating] =
  useState(0);

const [reviewCount, setReviewCount] =
  useState(0);

const [selectedVariants, setSelectedVariants] =
  useState<Record<string, string>>({});

const [similarProducts, setSimilarProducts] =
  useState<any[]>([]);

const [addingToWishlist, setAddingToWishlist] =
  useState(false);

const [processingCart, setProcessingCart] =
  useState(false);

const stock = Number(product.stock ?? 1);
const isOutOfStock = product.stock !== undefined && stock <= 0;
const isLowStock = product.stock !== undefined && stock > 0 && stock < 5;

  const navigation =
  useNavigation<
    NativeStackNavigationProp<
      RootStackParamList,
      "ProductDetails"
    >
  >();
useEffect(() => {

  // This screen is reused (not remounted) when the customer taps a
  // card in "You May Also Like" — that navigates to the already-
  // focused ProductDetails route with new params, so React Navigation
  // updates route.params in place instead of pushing a fresh screen.
  // Without resetting here, the previous product's reviews/rating/
  // similar-products/variant-selection/gallery-index would keep
  // showing under the new product's name until (for the async data)
  // the loads below resolve, or (for variants/gallery, which had no
  // reload at all) indefinitely.
  setSelectedImage(0);
  setReviews([]);
  setReviewCount(0);
  setAverageRating(0);
  setSimilarProducts([]);

  setSelectedVariants(() => {
    const initial: Record<string, string> = {};

    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant: any) => {
        if (variant.options?.length > 0) {
          initial[variant.label] = variant.options[0];
        }
      });
    }

    return initial;
  });

saveRecentlyViewed(
    product
  );
  loadReviews();
  loadSimilarProducts();

  async function loadSimilarProducts() {

    if (!product.category) return;

    try {

      const data =
        await getProductsByCategory(product.category);

      setSimilarProducts(
        data.filter((item: any) => item.id !== product.id).slice(0, 8)
      );

    } catch (error) {

      console.log(
        "Similar products error:",
        error
      );

    }

  }

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

}, [product.id]);
  function getDeliveryEstimate() {

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 4);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 6);

    const format = (date: Date) =>
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

    return `Delivery by ${format(minDate)} - ${format(maxDate)}`;

  }


  async function handleBuyNow() {

    if (isOutOfStock) {
      return;
    }

    // cartService.addToCart is a query-then-write, not atomic — a
    // fast double-tap (or tapping this and Add to Cart back to back)
    // can both see "no existing line yet" and each create their own
    // cart line for the same product/variant instead of one line
    // with quantity 2.
    if (processingCart) {
      return;
    }

    if (!auth.currentUser) {

      Alert.alert(
        "Login Required",
        "Please login to buy this product."
      );

      return;

    }

    try {

      setProcessingCart(true);

      await addToCart({ ...product, selectedVariants });

      navigation.navigate("Checkout");

    } catch (error) {

      console.log(
        "Buy Now error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to proceed to checkout."
      );

    } finally {

      setProcessingCart(false);

    }

  }

  async function handleAddToCart() {

    if (isOutOfStock) {
      return;
    }

    // Same non-atomic query-then-write race as Buy Now above.
    if (processingCart) {
      return;
    }

    if (!auth.currentUser) {

      Alert.alert(
        "Login Required",
        "Please login to add products to your cart."
      );

      return;

    }

    try {

      setProcessingCart(true);

      await addToCart({ ...product, selectedVariants });

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

    } finally {

      setProcessingCart(false);

    }

  }


  async function handleAddToWishlist() {

    // The duplicate check below is a query-then-insert, not atomic —
    // a fast double-tap could fire both requests before either's
    // insert lands, passing the "not already in wishlist" check
    // twice and creating two wishlist entries for the same product.
    if (addingToWishlist) {
      return;
    }

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

      setAddingToWishlist(true);

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

    } finally {

      setAddingToWishlist(false);

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

       {/* =========================
    PRODUCT IMAGE GALLERY
========================== */}

<View
  style={
    styles.gallery
  }
>

  <TouchableOpacity
    activeOpacity={0.95}
    onPress={() =>
      setZoomVisible(true)
    }
    style={
      styles.mainImageBox
    }
  >

    <Image
      source={{
        uri:
          productImages[selectedImage] ||
          productImages[0] ||
          "",
      }}
      style={
        styles.image
      }
      resizeMode="contain"
    />

    {/* IMAGE COUNT */}

    {productImages.length > 0 && (

      <View
        style={
          styles.imageCounter
        }
      >

        <Text
          style={
            styles.imageCounterText
          }
        >
          {selectedImage + 1} / {productImages.length}
        </Text>

      </View>

    )}

    {/* ZOOM ICON */}

    <View
      style={
        styles.zoomIcon
      }
    >

      <MaterialIcons
        name="zoom-in"
        size={21}
        color="#FFFFFF"
      />

    </View>

  </TouchableOpacity>


  {/* =========================
      THUMBNAILS
  ========================== */}

  {productImages.length > 1 && (

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.thumbnailList
      }
    >

      {productImages.map(
        (
          image: string,
          index: number
        ) => (

          <TouchableOpacity
            key={
              `${image}-${index}`
            }
            activeOpacity={0.8}
            onPress={() =>
              setSelectedImage(
                index
              )
            }
            style={[
              styles.thumbnail,
              index === selectedImage &&
                styles.thumbnailSelected,
            ]}
          >

            <Image
              source={{
                uri:
                  image,
              }}
              style={
                styles.thumbnailImage
              }
              resizeMode="contain"
            />

          </TouchableOpacity>

        )
      )}

    </ScrollView>

  )}

</View>


{/* =========================
    FULL SCREEN ZOOM VIEWER
========================== */}

<Modal
  visible={
    zoomVisible
  }
  transparent
  animationType="fade"
  onRequestClose={() =>
    setZoomVisible(false)
  }
>

  <View
    style={
      styles.zoomContainer
    }
  >

    <TouchableOpacity
      style={
        styles.closeZoom
      }
      activeOpacity={0.8}
      onPress={() =>
        setZoomVisible(false)
      }
    >

      <MaterialIcons
        name="close"
        size={28}
        color="#FFFFFF"
      />

    </TouchableOpacity>


    <ImageViewer
      imageUrls={
        productImages.map(
          (uri: string) => ({
            url: uri,
          })
        )
      }
      index={
        selectedImage
      }
      enableSwipeDown
      onSwipeDown={() =>
        setZoomVisible(false)
      }
      onChange={
        (index?: number) => {
          if (
            typeof index === "number"
          ) {
            setSelectedImage(
              index
            );
          }
        }
      }
      enablePreload
      saveToLocalByLongPress={
        false
      }
      backgroundColor="#000000"
      renderIndicator={(
        currentIndex,
        allSize
      ) => (
        <View
          style={
            styles.viewerIndicator
          }
        >

          <Text
            style={
              styles.viewerIndicatorText
            }
          >
            {currentIndex} / {allSize}
          </Text>

        </View>
      )}
    />

  </View>

</Modal>


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


          {/* VARIANTS */}

          {Array.isArray(product.variants) &&
            product.variants.length > 0 && (

            <View style={styles.variantsSection}>

              {product.variants.map((variant: any) => (

                <View
                  key={variant.label}
                  style={styles.variantGroup}
                >

                  <Text style={styles.variantLabel}>
                    {variant.label}: {selectedVariants[variant.label]}
                  </Text>

                  <View style={styles.variantOptionsRow}>

                    {variant.options.map((option: string) => (

                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.variantOption,
                          selectedVariants[variant.label] === option &&
                            styles.variantOptionActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() =>
                          setSelectedVariants((current) => ({
                            ...current,
                            [variant.label]: option,
                          }))
                        }
                      >

                        <Text
                          style={[
                            styles.variantOptionText,
                            selectedVariants[variant.label] === option &&
                              styles.variantOptionTextActive,
                          ]}
                        >
                          {option}
                        </Text>

                      </TouchableOpacity>

                    ))}

                  </View>

                </View>

              ))}

            </View>

          )}


          {isOutOfStock ? (

            <Text style={styles.outOfStock}>
              Out of Stock
            </Text>

          ) : (

            <>

              <Text
                style={styles.stock}
              >
                {product.stock !== undefined
                  ? `Stock : ${product.stock}`
                  : "In Stock"}
              </Text>

              {isLowStock && (

                <Text style={styles.lowStock}>
                  Only {product.stock} left — order soon
                </Text>

              )}

            </>

          )}


          <Text
            style={styles.vendor}
          >
            Sold by :{" "}
            {product.vendorName ||
              "YOMICO Seller"}
          </Text>


          <View style={styles.deliveryEstimateRow}>

            <MaterialIcons
              name="local-shipping"
              size={16}
              color="#16A34A"
            />

            <Text style={styles.deliveryEstimateText}>
              {getDeliveryEstimate()}
            </Text>

          </View>


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


    <View style={styles.ratingBreakdown}>

      {[5, 4, 3, 2, 1].map((star) => {

        const count = reviews.filter(
          (item: any) => Math.round(Number(item.rating || 0)) === star
        ).length;

        const percent = reviews.length > 0
          ? (count / reviews.length) * 100
          : 0;

        return (

          <View key={star} style={styles.ratingBarRow}>

            <Text style={styles.ratingBarLabel}>
              {star}★
            </Text>

            <View style={styles.ratingBarTrack}>

              <View
                style={[
                  styles.ratingBarFill,
                  { width: `${percent}%` },
                ]}
              />

            </View>

            <Text style={styles.ratingBarCount}>
              {count}
            </Text>

          </View>

        );

      })}

    </View>


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


          {Array.isArray(item.photos) && item.photos.length > 0 && (

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.reviewPhotosRow}
            >

              {item.photos.map((photoUrl: string, photoIndex: number) => (

                <Image
                  key={photoIndex}
                  source={{ uri: photoUrl }}
                  style={styles.reviewPhoto}
                  resizeMode="cover"
                />

              ))}

            </ScrollView>

          )}


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
            style={[
              styles.wishlistButton,
              addingToWishlist && styles.disabledButton,
            ]}
            onPress={
              handleAddToWishlist
            }
            activeOpacity={0.8}
            disabled={addingToWishlist}
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
            style={[
              styles.cartButton,
              (isOutOfStock || processingCart) && styles.disabledButton,
            ]}
            onPress={
              handleAddToCart
            }
            activeOpacity={0.8}
            disabled={isOutOfStock || processingCart}
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
            style={[
              styles.buyButton,
              (isOutOfStock || processingCart) && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={
              handleBuyNow
            }
            disabled={isOutOfStock || processingCart}
          >

            <Text
              style={styles.buttonText}
            >
              Buy Now
            </Text>

          </TouchableOpacity>

        </View>


        {/* SIMILAR PRODUCTS */}

        {similarProducts.length > 0 && (

          <View style={styles.similarSection}>

            <Text style={styles.heading}>
              You May Also Like
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
            >

              {similarProducts.map((item: any) => (
                <ProductCard key={item.id} product={item} />
              ))}

            </ScrollView>

          </View>

        )}

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
gallery: {
  width: "100%",
  backgroundColor: "#FFFFFF",
},

mainImageBox: {
  width: "100%",
  height: 300,
  backgroundColor: "#FFFFFF",
  position: "relative",
},

imageCounter: {
  position: "absolute",
  right: 12,
  bottom: 12,
  backgroundColor: "rgba(0,0,0,0.58)",
  paddingHorizontal: 9,
  paddingVertical: 5,
  borderRadius: 14,
},

imageCounterText: {
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "700",
},

zoomIcon: {
  position: "absolute",
  right: 12,
  top: 12,
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "rgba(0,0,0,0.55)",
  alignItems: "center",
  justifyContent: "center",
},

thumbnailList: {
  paddingHorizontal: 12,
  paddingVertical: 10,
},

thumbnail: {
  width: 58,
  height: 58,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#E2E8E4",
  backgroundColor: "#FFFFFF",
  marginRight: 8,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
},

thumbnailSelected: {
  borderWidth: 2,
  borderColor: "#16A34A",
},

thumbnailImage: {
  width: "90%",
  height: "90%",
},

zoomContainer: {
  flex: 1,
  backgroundColor: "#000000",
},

closeZoom: {
  position: "absolute",
  top: 45,
  right: 18,
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(0,0,0,0.65)",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
},

viewerIndicator: {
  position: "absolute",
  top: 50,
  left: 18,
  backgroundColor: "rgba(0,0,0,0.55)",
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 14,
},

viewerIndicatorText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "700",
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

    outOfStock: {
      marginTop: 10,
      fontSize: 13,
      color: "#DC2626",
      fontWeight: "800",
    },

    lowStock: {
      marginTop: 4,
      fontSize: 11,
      color: "#EA580C",
      fontWeight: "700",
    },

    deliveryEstimateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },

    deliveryEstimateText: {
      marginLeft: 6,
      fontSize: 12,
      color: "#333333",
      fontWeight: "600",
    },

    variantsSection: {
      marginTop: 14,
    },

    variantGroup: {
      marginBottom: 12,
    },

    variantLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#333333",
      marginBottom: 7,
    },

    variantOptionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    variantOption: {
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },

    variantOptionActive: {
      borderColor: "#16A34A",
      backgroundColor: "#F3FFF6",
    },

    variantOptionText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#555555",
    },

    variantOptionTextActive: {
      color: "#16A34A",
    },

    ratingBreakdown: {
      marginTop: 4,
      marginBottom: 10,
    },

    ratingBarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 5,
    },

    ratingBarLabel: {
      width: 26,
      fontSize: 11,
      color: "#555555",
      fontWeight: "600",
    },

    ratingBarTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#EEEEEE",
      marginHorizontal: 8,
      overflow: "hidden",
    },

    ratingBarFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FFB000",
    },

    ratingBarCount: {
      width: 20,
      fontSize: 11,
      color: "#777777",
      textAlign: "right",
    },

    reviewPhotosRow: {
      marginTop: 8,
    },

    reviewPhoto: {
      width: 64,
      height: 64,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: "#F5F5F5",
    },

    disabledButton: {
      opacity: 0.5,
    },

    similarSection: {
      marginTop: 22,
      paddingLeft: 14,
    },

    similarList: {
      paddingRight: 14,
      paddingTop: 4,
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