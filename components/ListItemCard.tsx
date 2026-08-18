import React from "react";

import type {
  ReactNode,
} from "react";

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";


export type ListItemCardProps = {

  // Required — every current consumer (Cart, Wishlist, Recently
  // Viewed) always has these three.
  image: string;

  title: string;

  price: number;

  // Optional display fields — omit entirely on screens that don't
  // show them. Cart passes none of these today.
  mrp?: number;

  discountPercent?: number;

  vendor?: string;

  // Optional — provide to make the whole row tappable (Wishlist and
  // Recently Viewed both navigate to ProductDetails this way). Omit
  // entirely to render a plain, non-tappable row — Cart's current
  // behavior, where only the inner buttons respond to taps.
  onPress?: () => void;

  // Optional — arbitrary content rendered at the bottom of the card.
  // ListItemCard has no opinion on what an "action" is — Cart's
  // quantity stepper, Wishlist's Add-to-Cart/Remove buttons (plus its
  // price-drop badge), and Recently Viewed's "View Product" link are
  // each owned entirely by the screen that renders them.
  actions?: ReactNode;

};


export default function ListItemCard({
  image,
  title,
  price,
  mrp,
  discountPercent,
  vendor,
  onPress,
  actions,
}: ListItemCardProps) {


  const showMrp =
    typeof mrp === "number" &&
    mrp > price;


  const showDiscount =
    typeof discountPercent === "number" &&
    discountPercent > 0;


  const content = (

    <>

      {/* IMAGE AREA */}

      <View
        style={
          styles.imageContainer
        }
      >

        {image ? (

          <Image
            source={{
              uri: image,
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


      {/* DETAILS */}

      <View
        style={
          styles.details
        }
      >

        <Text
          style={
            styles.title
          }
          numberOfLines={2}
        >
          {title || "Product"}
        </Text>


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
            ₹{price}
          </Text>


          {showMrp && (

            <Text
              style={
                styles.mrp
              }
            >
              ₹{mrp}
            </Text>

          )}

        </View>


        {/* DISCOUNT */}

        {showDiscount && (

          <Text
            style={
              styles.discount
            }
          >
            {discountPercent}% OFF
          </Text>

        )}


        {/* VENDOR */}

        {vendor ? (

          <Text
            style={
              styles.vendor
            }
            numberOfLines={1}
          >
            Sold by {vendor}
          </Text>

        ) : null}


        {/* ACTIONS (screen-owned) */}

        {actions}

      </View>

    </>

  );


  if (onPress) {

    return (

      <TouchableOpacity
        style={
          styles.card
        }
        activeOpacity={0.85}
        onPress={onPress}
      >

        {content}

      </TouchableOpacity>

    );

  }


  return (

    <View
      style={
        styles.card
      }
    >

      {content}

    </View>

  );

}


const styles =
  StyleSheet.create({

    // No explicit width — this is a full-width vertical-list row
    // (Cart/Wishlist/Recently Viewed each render it inside a single-
    // column FlatList), unlike ProductCard's fixed-width grid tiles.
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


    title: {
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
      textDecorationLine: "line-through",
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

  });
