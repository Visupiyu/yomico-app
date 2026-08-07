import React from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { addToCart } from "../services/cartService";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
type ProductDetailsRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetails"
>;
export default function ProductDetailsScreen() {

  const route = useRoute<ProductDetailsRouteProp>();

  const { product } = route.params;
async function handleAddToCart() {

  try {

    await addToCart(product);

    Alert.alert(
      "Success",
      "Product added to cart."
    );

  } catch (error) {

    Alert.alert(
      "Error",
      "Unable to add product."
    );

  }

}
  

  return (

    <SafeAreaView style={styles.container}>

      <ScrollView>

        <Image
  source={{
    uri:
      product.images?.[0] ||
      product.image,
  }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>

          <Text style={styles.name}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>

            <Text style={styles.price}>
              ₹{product.price}
            </Text>

            <Text style={styles.mrp}>
              ₹{product.mrp}
            </Text>

            <Text style={styles.discount}>
              {product.discountPercent}% OFF
            </Text>

          </View>

          <Text style={styles.stock}>
            Stock : {product.stock}
          </Text>

          <Text style={styles.vendor}>
            Sold by : {product.vendorName}
          </Text>

          <Text style={styles.heading}>
            Description
          </Text>

          <Text style={styles.description}>
            {product.description}
          </Text>

          <TouchableOpacity
  style={styles.cartButton}
  onPress={handleAddToCart}
>

            <MaterialIcons
              name="shopping-cart"
              size={22}
              color="#fff"
            />

            <Text style={styles.buttonText}>
              Add To Cart
            </Text>

          </TouchableOpacity>

          <TouchableOpacity style={styles.buyButton}>

            <Text style={styles.buttonText}>
              Buy Now
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  image: {
    width: "100%",
    height: 320,
  },

  content: {
    padding: 20,
  },

  name: {
    fontSize: 24,
    fontWeight: "bold",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  price: {
    fontSize: 24,
    color: "#16A34A",
    fontWeight: "bold",
  },

  mrp: {
    marginLeft: 10,
    textDecorationLine: "line-through",
    color: "#777",
  },

  discount: {
    marginLeft: 10,
    color: "red",
    fontWeight: "bold",
  },

  stock: {
    marginTop: 15,
    color: "#16A34A",
    fontWeight: "600",
  },

  vendor: {
    marginTop: 10,
    color: "#555",
  },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 25,
  },

  description: {
    marginTop: 10,
    color: "#555",
    lineHeight: 22,
  },

  cartButton: {
    marginTop: 30,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  buyButton: {
    marginTop: 15,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },

});