import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";

import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
export default function HomeScreen() {
const [products, setProducts] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadProducts();
}, []);

async function loadProducts() {
  const data = await getProducts();
  setProducts(data);
  setLoading(false);
}
  const categories = [
    "🍎 Grocery",
    "📱 Electronics",
    "👕 Fashion",
    "💄 Beauty",
    "🛋 Furniture",
    "👶 Kids",
    "🥛 Dairy",
    "💊 Pharmacy",
  ];

  return (

    <SafeAreaView style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>

          <Text style={styles.logo}>
            YOMICO
          </Text>

          <MaterialIcons
            name="notifications-none"
            size={30}
            color="#16A34A"
          />

        </View>

        <View style={styles.searchBox}>

          <MaterialIcons
            name="search"
            size={22}
            color="#777"
          />

          <TextInput
            placeholder="Search products..."
            style={styles.searchInput}
          />

        </View>

        <Text style={styles.location}>
          📍 Deliver to your location
        </Text>

        <View style={styles.banner}>

          <Text style={styles.bannerTitle}>
            BIG SALE
          </Text>

          <Text style={styles.bannerSub}>
            Up to 70% OFF on Selected Products
          </Text>

        </View>

       <Text style={styles.sectionTitle}>
  Latest Products
</Text>

<FlatList
  data={products}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <ProductCard product={item} />
  )}
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingHorizontal: 10,
    paddingBottom: 30,
  }}
/>
      </ScrollView>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#16A34A",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 10,
  },

  location: {
    margin: 20,
    color: "#555",
    fontWeight: "600",
  },

  banner: {
    backgroundColor: "#16A34A",
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  bannerSub: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 8,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    margin: 20,
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 30,
  },

  categoryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    alignItems: "center",
  },

  categoryText: {
    fontSize: 16,
    fontWeight: "600",
  },

});