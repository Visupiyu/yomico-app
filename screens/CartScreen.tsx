import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  getCartItems,
  updateCartQuantity,
  removeCartItem,
  moveToSavedForLater,
  moveToCart,
} from "../services/cartService";

import { MaterialIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";

import ListItemCard from "../components/ListItemCard";

import {
  getShippingSettings,
  calculateShipping,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_CHARGE,
  ShippingSettings,
} from "../services/shippingService";


export default function CartScreen() {

  const [cartItems, setCartItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings>({
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      standardShippingCharge: STANDARD_SHIPPING_CHARGE,
    });

  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList,
        "Checkout"
      >
    >();


  useEffect(() => {
    loadCart();
    getShippingSettings().then(setShippingSettings);
  }, []);


  async function loadCart() {

    const data =
      await getCartItems();

    setCartItems(data);

    setLoading(false);

  }


  async function increase(
    item: any
  ) {

    try {
      await updateCartQuantity(
        item.id,
        item.quantity + 1
      );

      loadCart();
    } catch (error) {
      Alert.alert("Error", "Couldn't update quantity. Please try again.");
    }

  }


  async function decrease(
    item: any
  ) {

    if (item.quantity === 1) {

      remove(item);

      return;
    }


    try {
      await updateCartQuantity(
        item.id,
        item.quantity - 1
      );

      loadCart();
    } catch (error) {
      Alert.alert("Error", "Couldn't update quantity. Please try again.");
    }

  }


  async function remove(
    item: any
  ) {

    await removeCartItem(
      item.id
    );

    Alert.alert(
      "Removed",
      "Product removed from cart."
    );

    loadCart();

  }


  async function saveForLater(
    item: any
  ) {

    try {
      await moveToSavedForLater(item.id);

      loadCart();
    } catch (error) {
      Alert.alert("Error", "Couldn't save item for later. Please try again.");
    }

  }


  async function moveBackToCart(
    item: any
  ) {

    try {
      await moveToCart(item.id);

      loadCart();
    } catch (error) {
      Alert.alert("Error", "Couldn't move item to cart. Please try again.");
    }

  }


  const activeItems =
    cartItems.filter((item) => !item.savedForLater);

  const savedItems =
    cartItems.filter((item) => item.savedForLater);


  const subtotal =
    activeItems.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );


  const shipping =
    calculateShipping(
      subtotal,
      shippingSettings
    );


  const total =
    subtotal + shipping;


  return (

    <SafeAreaView
      style={styles.container}
    >

      <Text
        style={styles.title}
      >
        My Cart
      </Text>


      <FlatList

        data={activeItems}

        keyExtractor={(item) =>
          item.id
        }

        showsVerticalScrollIndicator={
          false
        }

        renderItem={({
          item,
        }) => (

          <ListItemCard
            image={item.image}
            title={item.name}
            price={item.price}
            actions={

              <>

                <View
                  style={styles.qtyRow}
                >

                  <TouchableOpacity
                    onPress={() =>
                      decrease(item)
                    }
                    style={
                      styles.qtyButton
                    }
                  >

                    <MaterialIcons
                      name="remove"
                      size={17}
                      color="#FFFFFF"
                    />

                  </TouchableOpacity>


                  <Text
                    style={styles.qty}
                  >
                    {item.quantity}
                  </Text>


                  <TouchableOpacity
                    onPress={() =>
                      increase(item)
                    }
                    style={
                      styles.qtyButtonGreen
                    }
                  >

                    <MaterialIcons
                      name="add"
                      size={17}
                      color="#FFFFFF"
                    />

                  </TouchableOpacity>

                </View>


                <View style={styles.itemActionsRow}>

                  <TouchableOpacity
                    onPress={() =>
                      remove(item)
                    }
                  >

                    <Text
                      style={styles.remove}
                    >
                      Remove
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      saveForLater(item)
                    }
                  >

                    <Text
                      style={styles.saveForLater}
                    >
                      Save for later
                    </Text>

                  </TouchableOpacity>

                </View>

              </>

            }
          />

        )}

        ListEmptyComponent={

          <View style={styles.emptyBox}>

            {loading ? (

              <ActivityIndicator
                size="small"
                color="#16A34A"
              />

            ) : (

              <Text style={styles.emptyText}>
                Your cart is empty.
              </Text>

            )}

          </View>

        }


        ListFooterComponent={

          <View>

            {activeItems.length > 0 && (

              <View
                style={styles.summary}
              >

                <View
                  style={styles.summaryRow}
                >

                  <Text
                    style={styles.summaryLabel}
                  >
                    Subtotal
                  </Text>

                  <Text
                    style={styles.summaryValue}
                  >
                    ₹{subtotal}
                  </Text>

                </View>


                <View
                  style={styles.summaryRow}
                >

                  <Text
                    style={styles.summaryLabel}
                  >
                    Shipping
                  </Text>

                  <Text
                    style={styles.summaryValue}
                  >
                    ₹{shipping}
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
                    ₹{total}
                  </Text>

                </View>


                <TouchableOpacity
                  style={
                    styles.checkoutButton
                  }
                  onPress={() =>
                    navigation.navigate(
                      "Checkout"
                    )
                  }
                >

                  <Text
                    style={
                      styles.checkoutText
                    }
                  >
                    Proceed To Checkout
                  </Text>

                </TouchableOpacity>

              </View>

            )}


            {savedItems.length > 0 && (

              <View style={styles.savedSection}>

                <Text style={styles.savedTitle}>
                  Saved for Later ({savedItems.length})
                </Text>

                {savedItems.map((item) => (

                  <ListItemCard
                    key={item.id}
                    image={item.image}
                    title={item.name}
                    price={item.price}
                    actions={

                      <View style={styles.itemActionsRow}>

                        <TouchableOpacity
                          onPress={() =>
                            remove(item)
                          }
                        >

                          <Text
                            style={styles.remove}
                          >
                            Remove
                          </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            moveBackToCart(item)
                          }
                        >

                          <Text
                            style={styles.moveToCart}
                          >
                            Move to Cart
                          </Text>

                        </TouchableOpacity>

                      </View>

                    }
                  />

                ))}

              </View>

            )}

          </View>

        }

      />

    </SafeAreaView>

  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },


    title: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },


    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 7,
    },


    qtyButton: {
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: "#E53935",
      alignItems: "center",
      justifyContent: "center",
    },


    qtyButtonGreen: {
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },


    qty: {
      marginHorizontal: 10,
      fontSize: 14,
      fontWeight: "700",
      color: "#222",
    },


    itemActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },


    remove: {
      color: "#E53935",
      fontSize: 11,
      fontWeight: "600",
    },


    saveForLater: {
      color: "#16A34A",
      fontSize: 11,
      fontWeight: "600",
      marginLeft: 16,
    },


    moveToCart: {
      color: "#16A34A",
      fontSize: 11,
      fontWeight: "600",
      marginLeft: 16,
    },


    emptyBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
    },


    emptyText: {
      fontSize: 13,
      color: "#777777",
    },


    summary: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderColor: "#EEEEEE",
    },


    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
    },


    summaryLabel: {
      fontSize: 13,
      color: "#555",
    },


    summaryValue: {
      fontSize: 13,
      color: "#333",
      fontWeight: "600",
    },


    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderColor: "#EEEEEE",
    },


    totalLabel: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222",
    },


    total: {
      fontSize: 17,
      fontWeight: "800",
      color: "#16A34A",
    },


    checkoutButton: {
      backgroundColor: "#16A34A",
      height: 46,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },


    checkoutText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 15,
    },


    savedSection: {
      marginTop: 8,
      borderTopWidth: 8,
      borderTopColor: "#F5F5F5",
      paddingBottom: 20,
    },


    savedTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#222",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

  });
