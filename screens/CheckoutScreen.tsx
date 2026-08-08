import React, { useState } from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import {
  getCartItems,
  removeCartItem,
} from "../services/cartService";

import { useNavigation } from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type NavigationProp =
  NativeStackNavigationProp<
    RootStackParamList,
    "Checkout"
  >;


export default function CheckoutScreen() {

  const navigation =
    useNavigation<NavigationProp>();

  const [name, setName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const shipping = 50;


  async function placeOrder() {

    if (
      !name.trim() ||
      !mobile.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pincode.trim()
    ) {

      Alert.alert(
        "Missing Information",
        "Please fill all delivery details."
      );

      return;
    }


    if (mobile.trim().length < 10) {

      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid mobile number."
      );

      return;
    }


    if (pincode.trim().length !== 6) {

      Alert.alert(
        "Invalid PIN Code",
        "Please enter a valid 6-digit PIN code."
      );

      return;
    }


    const user =
      auth.currentUser;


    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login before placing an order."
      );

      navigation.replace("Login");

      return;
    }


    try {

      setLoading(true);


      const cartItems =
        await getCartItems();


      if (
        !cartItems ||
        cartItems.length === 0
      ) {

        Alert.alert(
          "Cart Empty",
          "Your cart is empty."
        );

        navigation.navigate("Cart");

        return;
      }


      const subtotal =
        cartItems.reduce(
          (
            sum: number,
            item: any
          ) =>
            sum +
            Number(item.price) *
              Number(item.quantity),
          0
        );


      const finalShipping =
        subtotal > 500
          ? 0
          : shipping;


      const total =
        subtotal +
        finalShipping;


      const orderData = {

        userId: user.uid,

        customerName:
          name.trim(),

        customerEmail:
          user.email || "",

        customerMobile:
          mobile.trim(),

        deliveryAddress:
          address.trim(),

        city:
          city.trim(),

        pincode:
          pincode.trim(),

        items: cartItems,

        subtotal:
          subtotal,

        shipping:
          finalShipping,

        total:
          total,

        paymentMethod:
          "COD",

        paymentStatus:
          "Pending",

        status:
          "Pending",

        createdAt:
          serverTimestamp(),

      };


      await addDoc(
        collection(
          db,
          "orders"
        ),
        orderData
      );


      /*
       * Remove purchased items
       * from the cart.
       */

      for (
        const item of cartItems
      ) {

        await removeCartItem(
          item.id
        );

      }


      Alert.alert(
        "Order Placed",
        "Your order has been placed successfully!",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.replace(
                "Home"
              ),
          },
        ]
      );

    } catch (error) {

      console.log(
        "Order error:",
        error
      );

      Alert.alert(
        "Order Failed",
        "Unable to place your order. Please try again."
      );

    } finally {

      setLoading(false);

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

        <View
          style={styles.header}
        >

          <Text
  allowFontScaling={false}
  style={styles.title}
>
  Checkout
</Text>

<Text
  allowFontScaling={false}
  style={styles.subtitle}
>
  Delivery Details
</Text>

        </View>


        <View
          style={styles.form}
        >

         <Text
  allowFontScaling={false}
  style={styles.label}
>
  Full Name
</Text>

          <TextInput
  allowFontScaling={false}
  placeholder="Enter your name"
  placeholderTextColor="#999"
  style={styles.input}
  value={name}
  onChangeText={setName}
/>


          <Text
            style={styles.label}
          >
            Mobile Number
          </Text>

          <TextInput
            placeholder="Enter mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
          />


          <Text
            style={styles.label}
          >
            Address
          </Text>

          <TextInput
            placeholder="House / Street / Area"
            placeholderTextColor="#999"
            style={[
              styles.input,
              styles.addressInput,
            ]}
            value={address}
            onChangeText={setAddress}
            multiline
          />


          <Text
            style={styles.label}
          >
            City
          </Text>

          <TextInput
            placeholder="Enter city"
            placeholderTextColor="#999"
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />


          <Text
            style={styles.label}
          >
            PIN Code
          </Text>

          <TextInput
            placeholder="6-digit PIN code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            maxLength={6}
          />

        </View>


        <View
          style={styles.paymentCard}
        >

          <Text
            style={styles.sectionTitle}
          >
            Payment Method
          </Text>

          <View
            style={styles.codRow}
          >

            <View
              style={styles.radio}
            />

            <View
              style={styles.codTextContainer}
            >

              <Text
                style={styles.codTitle}
              >
                Cash on Delivery
              </Text>

              <Text
                style={styles.codSubtitle}
              >
                Pay when your order arrives
              </Text>

            </View>

          </View>

        </View>


        <View
          style={styles.summary}
        >

          <Text
            style={styles.sectionTitle}
          >
            Order Summary
          </Text>


          <View
            style={styles.summaryRow}
          >

            <Text
              style={styles.summaryLabel}
            >
              Items
            </Text>

            <Text
              style={styles.summaryValue}
            >
              Calculated at checkout
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
              ₹50 / Free above ₹500
            </Text>

          </View>


          <View
            style={styles.securityRow}
          >

            <Text
              style={styles.securityText}
            >
              🔒 Secure order
            </Text>

          </View>

        </View>


        <TouchableOpacity
          style={[
            styles.placeButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={placeOrder}
          disabled={loading}
        >

          <Text
            style={styles.placeButtonText}
          >
            {loading
              ? "Placing Order..."
              : "Place Order • COD"}
          </Text>

        </TouchableOpacity>


        <View
          style={styles.bottomSpace}
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
  },

  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#777777",
    marginTop: 2,
  },

  form: {
    backgroundColor: "#FFFFFF",
    marginTop: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 5,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 11,
    fontSize: 13,
    color: "#222222",
    marginBottom: 11,
    backgroundColor: "#FFFFFF",
  },

  addressInput: {
    height: 65,
    paddingTop: 10,
    textAlignVertical: "top",
  },

  paymentCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 7,
    padding: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 9,
  },

  codRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 9,
    padding: 10,
    backgroundColor: "#F3FFF6",
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#16A34A",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },

  codTextContainer: {
    marginLeft: 9,
  },

  codTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },

  codSubtitle: {
    fontSize: 11,
    color: "#777777",
    marginTop: 2,
  },

  summary: {
    backgroundColor: "#FFFFFF",
    marginTop: 7,
    padding: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#555555",
  },

  summaryValue: {
    fontSize: 12,
    color: "#555555",
    textAlign: "right",
  },

  securityRow: {
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  securityText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
  },

  placeButton: {
    marginHorizontal: 14,
    marginTop: 11,
    backgroundColor: "#16A34A",
    height: 46,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  placeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 20,
  },

});