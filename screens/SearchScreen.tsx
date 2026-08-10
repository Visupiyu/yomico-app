import React, {
  useEffect,
  useMemo,
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
  ScrollView,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  getProducts,
  getProductsByCategory,
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

type SortOption =
  | "newest"
  | "priceAsc"
  | "priceDesc"
  | "rating";

const SORT_OPTIONS: {
  key: SortOption;
  label: string;
}[] = [
  { key: "newest", label: "Newest" },
  { key: "priceAsc", label: "Price: Low to High" },
  { key: "priceDesc", label: "Price: High to Low" },
  { key: "rating", label: "Rating" },
];

const RATING_OPTIONS = [4, 3, 2, 1];


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

  const [activeCategory, setActiveCategory] =
    useState(
      route.params?.category || null
    );

  const [searchText, setSearchText] =
    useState("");

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showFilters, setShowFilters] =
    useState(false);

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [minRating, setMinRating] =
    useState<number | null>(null);

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");


  useEffect(() => {

    loadProducts();

  }, [activeCategory]);


  async function loadProducts() {

    try {

      setLoading(true);

      const data = activeCategory
        ? await getProductsByCategory(activeCategory)
        : await getProducts();

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


  const filteredProducts = useMemo(() => {

    const search =
      searchText.trim().toLowerCase();

    const min = minPrice
      ? Number(minPrice)
      : null;

    const max = maxPrice
      ? Number(maxPrice)
      : null;

    let result = products.filter(
      (product: any) => {

        if (search) {

          const matches =
            String(product.name || "")
              .toLowerCase()
              .includes(search) ||
            String(product.category || "")
              .toLowerCase()
              .includes(search);

          if (!matches) return false;

        }

        const price = Number(product.price) || 0;

        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;

        if (minRating !== null) {

          const rating =
            Number(product.rating || product.averageRating || 0);

          if (rating < minRating) return false;

        }

        return true;

      }
    );

    result = [...result].sort((a: any, b: any) => {

      if (sortBy === "priceAsc") {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }

      if (sortBy === "priceDesc") {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }

      if (sortBy === "rating") {
        const ratingA = Number(a.rating || a.averageRating || 0);
        const ratingB = Number(b.rating || b.averageRating || 0);
        return ratingB - ratingA;
      }

      return 0;

    });

    return result;

  }, [products, searchText, minPrice, maxPrice, minRating, sortBy]);


  function clearFilters() {

    setMinPrice("");
    setMaxPrice("");
    setMinRating(null);
    setSortBy("newest");

  }


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

        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() =>
            setShowFilters(!showFilters)
          }
        >

          <MaterialIcons
            name="tune"
            size={20}
            color={
              showFilters ? "#16A34A" : "#777777"
            }
          />

        </TouchableOpacity>

      </View>


      {/* ACTIVE CATEGORY CHIP */}

      {activeCategory && (

        <View style={styles.categoryChipRow}>

          <View style={styles.categoryChip}>

            <Text style={styles.categoryChipText}>
              {activeCategory}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setActiveCategory(null)
              }
            >

              <MaterialIcons
                name="close"
                size={16}
                color="#16A34A"
              />

            </TouchableOpacity>

          </View>

        </View>

      )}


      {/* FILTERS PANEL */}

      {showFilters && (

        <View style={styles.filtersPanel}>

          <Text style={styles.filterLabel}>
            Price Range
          </Text>

          <View style={styles.priceRow}>

            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              value={minPrice}
              onChangeText={setMinPrice}
            />

            <Text style={styles.priceSeparator}>
              —
            </Text>

            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />

          </View>

          <Text style={styles.filterLabel}>
            Minimum Rating
          </Text>

          <View style={styles.chipRow}>

            {RATING_OPTIONS.map((rating) => (

              <TouchableOpacity
                key={rating}
                style={[
                  styles.chip,
                  minRating === rating && styles.chipActive,
                ]}
                onPress={() =>
                  setMinRating(
                    minRating === rating ? null : rating
                  )
                }
              >

                <Text
                  style={[
                    styles.chipText,
                    minRating === rating && styles.chipTextActive,
                  ]}
                >
                  {rating}★ & up
                </Text>

              </TouchableOpacity>

            ))}

          </View>

          <Text style={styles.filterLabel}>
            Sort By
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >

            <View style={styles.chipRow}>

              {SORT_OPTIONS.map((option) => (

                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    sortBy === option.key && styles.chipActive,
                  ]}
                  onPress={() =>
                    setSortBy(option.key)
                  }
                >

                  <Text
                    style={[
                      styles.chipText,
                      sortBy === option.key && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>

                </TouchableOpacity>

              ))}

            </View>

          </ScrollView>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >

            <Text style={styles.clearFiltersText}>
              Clear Filters
            </Text>

          </TouchableOpacity>

        </View>

      )}


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

    filterToggle: {
      marginLeft: 8,
      paddingLeft: 8,
      borderLeftWidth: 1,
      borderLeftColor: "#EEEEEE",
    },

    categoryChipRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      marginBottom: 8,
    },

    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E9FFF1",
      borderWidth: 1,
      borderColor: "#16A34A",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    categoryChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#16A34A",
      marginRight: 6,
    },

    filtersPanel: {
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 12,
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    filterLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#333333",
      marginTop: 8,
      marginBottom: 6,
    },

    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    priceInput: {
      flex: 1,
      height: 38,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 10,
      fontSize: 12,
      color: "#222222",
    },

    priceSeparator: {
      marginHorizontal: 8,
      color: "#999999",
    },

    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    chip: {
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },

    chipActive: {
      backgroundColor: "#16A34A",
      borderColor: "#16A34A",
    },

    chipText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#555555",
    },

    chipTextActive: {
      color: "#FFFFFF",
    },

    clearFiltersButton: {
      alignSelf: "flex-start",
      marginTop: 4,
    },

    clearFiltersText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#DC2626",
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
