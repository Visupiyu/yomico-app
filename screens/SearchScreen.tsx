import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  getProducts,
} from "../services/productService";

import ProductCard from "../components/ProductCard";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type {
  RouteProp,
} from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "Search"
  >;


export default function SearchScreen() {

  const navigation =
    useNavigation<NavigationProp>();
const route =
  useRoute<
    RouteProp<
      RootStackParamList,
      "Search"
    >
  >();

 const [searchText, setSearchText] =
  useState(
    route.params?.category || ""
  );

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    loadProducts();

  }, []);


  async function loadProducts() {

    try {

      const data =
        await getProducts();

      setProducts(data);

    } catch (error) {

      console.log(
        "Search product error:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  const filteredProducts =
    products.filter(
      (product: any) => {

        const search =
          searchText
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        return (
          String(
            product.name || ""
          )
            .toLowerCase()
            .includes(search) ||

          String(
            product.category || ""
          )
            .toLowerCase()
            .includes(search)
        );

      }
    );


  return (

    <SafeAreaView
      style={styles.container}
    >

      {/* SEARCH BAR */}

      <View
        style={styles.searchContainer}
      >

        <MaterialIcons
          name="search"
          size={22}
          color="#777777"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999999"
          value={searchText}
          onChangeText={
            setSearchText
          }
          autoCapitalize="none"
        />

        {searchText.length > 0 && (

          <TouchableOpacity
            onPress={() =>
              setSearchText("")
            }
          >

            <MaterialIcons
              name="close"
              size={20}
              color="#777777"
            />

          </TouchableOpacity>

        )}

      </View>


      {/* RESULTS */}

      {loading ? (

        <View
          style={styles.loading}
        >

          <ActivityIndicator
            size="small"
            color="#16A34A"
          />

        </View>

      ) : (

        <FlatList
          data={filteredProducts}
          keyExtractor={(
            item: any,
            index
          ) =>
            item.id ||
            String(index)
          }
          numColumns={2}
          contentContainerStyle={
            styles.list
          }
          columnWrapperStyle={
            styles.row
          }
          renderItem={({
            item,
          }) => (

            <View
              style={styles.card}
            >

              <ProductCard
                product={item}
              />

            </View>

          )}
          ListEmptyComponent={

            <View
              style={styles.empty}
            >

              <MaterialIcons
                name="search-off"
                size={42}
                color="#BBBBBB"
              />

              <Text
                style={styles.emptyTitle}
              >
                No products found
              </Text>

              <Text
                style={styles.emptyText}
              >
                Try another product
                or category.
              </Text>

            </View>

          }
        />

      )}

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
    },

    searchContainer: {
      margin: 12,
      height: 44,
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 13,
      color: "#222222",
    },

    list: {
      paddingHorizontal: 8,
      paddingBottom: 25,
    },

    row: {
      justifyContent: "space-between",
    },

    card: {
      width: "48%",
      marginBottom: 10,
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      paddingHorizontal: 30,
    },

    emptyTitle: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: "800",
      color: "#333333",
    },

    emptyText: {
      marginTop: 5,
      fontSize: 12,
      color: "#777777",
      textAlign: "center",
    },

  });