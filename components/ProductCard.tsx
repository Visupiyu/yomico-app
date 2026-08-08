import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

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


  return (

    <TouchableOpacity
      style={styles.card}
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
          uri: product.image,
        }}
        style={styles.image}
        resizeMode="cover"
      />


      <Text
        style={styles.name}
        numberOfLines={2}
      >
        {product.name}
      </Text>


      <View
        style={styles.priceRow}
      >

        <Text
          style={styles.price}
        >
          ₹{product.price}
        </Text>


        {product.mrp ? (

          <Text
            style={styles.mrp}
          >
            ₹{product.mrp}
          </Text>

        ) : null}

      </View>


      {product.discountPercent ? (

        <Text
          style={styles.discount}
        >
          {product.discountPercent}% OFF
        </Text>

      ) : null}


      <View
        style={styles.bottomRow}
      >

        <TouchableOpacity
          activeOpacity={0.7}
        >

          <MaterialIcons
            name="favorite-border"
            size={19}
            color="#E53935"
          />

        </TouchableOpacity>


        <TouchableOpacity
          style={styles.cartButton}
          activeOpacity={0.7}
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
      backgroundColor: "#FFFFFF",
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
      backgroundColor: "#F5F5F5",
    },


    name: {
      fontSize: 11,
      fontWeight: "600",
      marginTop: 5,
      minHeight: 30,
      color: "#222",
    },


    priceRow: {
      flexDirection: "row",
      alignItems: "center",
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
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 6,
      alignItems: "center",
    },


    cartButton: {
      backgroundColor: "#16A34A",
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 6,
    },

  });