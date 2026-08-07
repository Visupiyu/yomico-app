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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
type ProductProps = {
  product: any;
};
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;
export default function ProductCard({
  product,
}: ProductProps) {
const navigation = useNavigation<NavigationProp>();
  return (

    <TouchableOpacity
  style={styles.card}
  activeOpacity={0.8}
  onPress={() =>
    navigation.navigate("ProductDetails", {
      product,
    })
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

      <View style={styles.priceRow}>

        <Text style={styles.price}>
          ₹{product.price}
        </Text>

        <Text style={styles.mrp}>
          ₹{product.mrp}
        </Text>

      </View>

      <Text style={styles.discount}>
        {product.discountPercent}% OFF
      </Text>

      <View style={styles.bottomRow}>

        <TouchableOpacity>

          <MaterialIcons
            name="favorite-border"
            size={24}
            color="red"
          />

        </TouchableOpacity>

        <TouchableOpacity style={styles.cartButton}>

          <MaterialIcons
            name="shopping-cart"
            size={20}
            color="#FFFFFF"
          />

        </TouchableOpacity>

      </View>

    </TouchableOpacity>

  );

}

const styles = StyleSheet.create({

  card: {
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 10,
    margin: 8,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    minHeight: 42,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },

  mrp: {
    marginLeft: 10,
    textDecorationLine: "line-through",
    color: "#888",
  },

  discount: {
    color: "red",
    marginTop: 5,
    fontWeight: "bold",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    alignItems: "center",
  },

  cartButton: {
    backgroundColor: "#16A34A",
    padding: 8,
    borderRadius: 10,
  },

});