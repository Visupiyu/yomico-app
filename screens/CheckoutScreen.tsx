import React, {
  useEffect,
  useState,
} from "react";

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
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import {
  getCartItems,
  removeCartItem,
} from "../services/cartService";

import {
  createNotification,
} from "../services/notificationService";

import {
  validateCoupon,
} from "../services/couponService";

import {
  PAY_ON_DELIVERY_METHOD,
  formatPaymentMethod,
} from "../utils/paymentMethod";

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

  /*
    Only one payment method exists today: UPI collected at
    delivery. Cash is not accepted. Kept as a named constant
    (not a toggle) so a future prepaid/online method can be
    added here without another checkout redesign.
  */
  const paymentMethod = PAY_ON_DELIVERY_METHOD;

const [gstAmount, setGstAmount] =
  useState(0);

const platformFee = 5;
const [cartItemsTotalMRP, setCartItemsTotalMRP] =
  useState(0);

  const [addressLoading, setAddressLoading] =
    useState(true);

  const [savedAddresses, setSavedAddresses] =
    useState<any[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(null);

  const [showAddressPicker, setShowAddressPicker] =
    useState(false);

  const DELIVERY_SLOTS = [
    "Today, 4 PM - 8 PM",
    "Tomorrow, 9 AM - 12 PM",
    "Tomorrow, 4 PM - 8 PM",
  ];

  const [deliverySlot, setDeliverySlot] =
    useState(DELIVERY_SLOTS[0]);

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<{ code: string; discountAmount: number } | null>(null);

  const [couponError, setCouponError] =
    useState("");

  const [applyingCoupon, setApplyingCoupon] =
    useState(false);


  const shipping = 50;
    const [subtotal, setSubtotal] =
    useState(0);
    

  const [shippingAmount, setShippingAmount] =
    useState(0);
    


  useEffect(() => {

    loadSavedAddress();
     loadCartSummary();

  }, []);
async function loadCartSummary() {

  try {

    const items =
      await getCartItems();
      const calculatedMRP =
  items.reduce(
    (
      sum: number,
      item: any
    ) =>
      sum +
      Number(
        item.mrp || item.price
      ) *
        Number(item.quantity),
    0
  );

setCartItemsTotalMRP(
  calculatedMRP
);

    const calculatedSubtotal =
      items.reduce(
        (
          sum: number,
          item: any
        ) =>
          sum +
          Number(item.price) *
            Number(item.quantity),
        0
      );

    const calculatedShipping =
      calculatedSubtotal > 500
        ? 0
        : shipping;

    const calculatedGst =
      items.reduce(
        (
          sum: number,
          item: any
        ) => { 

          const itemTotal =
            Number(item.price) *
            Number(item.quantity);

          const gstPercent =
            Number(
              item.gstPercent || 0
            );

          return (
            sum +
            (itemTotal * gstPercent) /
              100
          );

        },
        0
      );

    setSubtotal(
      calculatedSubtotal
    );

    setShippingAmount(
      calculatedShipping
    );

    setGstAmount(
      calculatedGst
    );

  } catch (error) {

    console.log(
      "Cart summary error:",
      error
    );

  }

}

  function selectAddress(savedAddress: any) {

    setSelectedAddressId(savedAddress.id);

    setName(
      savedAddress.name || ""
    );

    setMobile(
      savedAddress.mobile || ""
    );

    setAddress(
      savedAddress.address || ""
    );

    setCity(
      savedAddress.city || ""
    );

    setPincode(
      savedAddress.pincode || ""
    );

    setShowAddressPicker(false);

  }


  async function loadSavedAddress() {

    const user =
      auth.currentUser;


    if (!user) {

      setAddressLoading(false);

      return;

    }


    try {

      const addressQuery =
        query(
          collection(
            db,
            "addresses"
          ),
          where(
            "userId",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(
          addressQuery
        );


      if (
        !snapshot.empty
      ) {

        const allAddresses =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));

        allAddresses.sort(
          (a: any, b: any) =>
            (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
        );

        setSavedAddresses(allAddresses);

        selectAddress(allAddresses[0]);

      }

    } catch (error) {

      console.log(
        "Saved address loading error:",
        error
      );

    } finally {

      setAddressLoading(false);

    }

  }


  async function applyCoupon() {

    setCouponError("");

    try {

      setApplyingCoupon(true);

      const result = await validateCoupon(
        couponCode,
        subtotal
      );

      setAppliedCoupon(result);

    } catch (error: any) {

      setAppliedCoupon(null);

      setCouponError(
        error.message || "Unable to apply coupon."
      );

    } finally {

      setApplyingCoupon(false);

    }

  }


  function removeCoupon() {

    setAppliedCoupon(null);

    setCouponCode("");

    setCouponError("");

  }


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


    if (
      mobile.trim().length < 10
    ) {

      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid mobile number."
      );

      return;

    }


    if (
      pincode.trim().length !== 6
    ) {

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

     navigation.navigate("MainTabs", {
  screen: "LoginTab",
});

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

        navigation.navigate("MainTabs", {
  screen: "CartTab",
});
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


const calculatedGst =
  cartItems.reduce(
    (
      sum: number,
      item: any
    ) => {

      const itemTotal =
        Number(item.price) *
        Number(item.quantity);

      const gstPercent =
        Number(item.gstPercent || 0);

      return (
        sum +
        (itemTotal * gstPercent) / 100
      );

    },
    0
  );
setGstAmount(
  calculatedGst
);

      const finalShipping =
        subtotal > 500
          ? 0
          : shipping;


     const platformFee = 5;

const discountAmount =
  appliedCoupon?.discountAmount || 0;

const total =
  subtotal +
  finalShipping +
  platformFee +
  calculatedGst -
  discountAmount;

      const orderData = {

        userId:
          user.uid,

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

        deliverySlot:
          deliverySlot,

        items:
          cartItems,

        subtotal:
          subtotal,

        shipping:
          finalShipping,

        couponCode:
          appliedCoupon?.code || null,

        discountAmount:
          discountAmount,

        total:
          total,

        paymentMethod:
          paymentMethod,

        paymentStatus:
          "Pending",

        status:
          "Pending",

       createdAt:
  serverTimestamp(),

gstAmount:
  calculatedGst,

platformFee:
  platformFee,
};
     


      await addDoc(
        collection(
          db,
          "orders"
        ),
        orderData
      );

      try {

        await createNotification({
          userId: user.uid,
          title: "Order Placed",
          message: `Your order for ₹${total.toFixed(0)} has been placed successfully.`,
        });

      } catch (notificationError) {

        console.log(
          "Order notification error:",
          notificationError
        );

      }


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
              navigation.replace("MainTabs", {
  screen: "HomeTab",
}
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

        {/* HEADER */}

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


        {/* SAVED ADDRESS MESSAGE */}

        {!addressLoading &&
          name &&
          address && (

          <View
            style={styles.savedAddressBanner}
          >

            <View style={styles.savedAddressRow}>

              <View style={{ flex: 1 }}>

                <Text
                  style={
                    styles.savedAddressTitle
                  }
                >
                  ✓ Saved address loaded
                </Text>

                <Text
                  style={
                    styles.savedAddressText
                  }
                >
                  Your saved delivery address
                  has been filled automatically.
                </Text>

              </View>

              {savedAddresses.length > 1 && (

                <TouchableOpacity
                  onPress={() =>
                    setShowAddressPicker(!showAddressPicker)
                  }
                >

                  <Text style={styles.changeAddressText}>
                    {showAddressPicker ? "Hide" : "Change"}
                  </Text>

                </TouchableOpacity>

              )}

            </View>

            {showAddressPicker && (

              <View style={styles.addressPickerList}>

                {savedAddresses.map((item) => (

                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.addressPickerCard,
                      selectedAddressId === item.id &&
                        styles.addressPickerCardActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => selectAddress(item)}
                  >

                    <View style={styles.addressPickerRow}>

                      <Text style={styles.addressPickerName}>
                        {item.name}
                      </Text>

                      {item.isDefault && (

                        <Text style={styles.addressPickerDefault}>
                          Default
                        </Text>

                      )}

                    </View>

                    <Text
                      style={styles.addressPickerText}
                      numberOfLines={1}
                    >
                      {item.address}, {item.city} {item.pincode}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

            )}

          </View>

        )}


        {/* DELIVERY FORM */}

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
            allowFontScaling={false}
            style={styles.label}
          >
            Mobile Number
          </Text>


          <TextInput
            allowFontScaling={false}
            placeholder="Enter mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
          />


          <Text
            allowFontScaling={false}
            style={styles.label}
          >
            Address
          </Text>


          <TextInput
            allowFontScaling={false}
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
            allowFontScaling={false}
            style={styles.label}
          >
            City
          </Text>


          <TextInput
            allowFontScaling={false}
            placeholder="Enter city"
            placeholderTextColor="#999"
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />


          <Text
            allowFontScaling={false}
            style={styles.label}
          >
            PIN Code
          </Text>


          <TextInput
            allowFontScaling={false}
            placeholder="6-digit PIN code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            maxLength={6}
          />

        </View>


        {/* DELIVERY SLOT */}

        <View style={styles.paymentCard}>

          <Text style={styles.sectionTitle}>
            Delivery Slot
          </Text>

          <View style={styles.slotRow}>

            {DELIVERY_SLOTS.map((slot) => (

              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotChip,
                  deliverySlot === slot && styles.slotChipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setDeliverySlot(slot)}
              >

                <Text
                  style={[
                    styles.slotChipText,
                    deliverySlot === slot && styles.slotChipTextActive,
                  ]}
                >
                  {slot}
                </Text>

              </TouchableOpacity>

            ))}

          </View>

        </View>


        {/* BANK OFFER */}

        <View style={styles.bankOfferBanner}>

          <Text style={styles.bankOfferIcon}>💳</Text>

          <Text style={styles.bankOfferText}>
            Get 10% instant discount up to ₹150 on YOMICO Bank Card EMI transactions. T&C apply.
          </Text>

        </View>


        {/* PAYMENT */}

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
                Pay on Delivery (UPI Only)
              </Text>


              <Text
                style={styles.codSubtitle}
              >
                Pay securely via UPI when your order is delivered. Cash is not accepted.
              </Text>

            </View>

          </View>

        </View>


       {/* COUPON */}

<View style={styles.paymentCard}>

  <Text style={styles.sectionTitle}>
    Coupon
  </Text>

  {appliedCoupon ? (

    <View style={styles.couponAppliedRow}>

      <View style={{ flex: 1 }}>

        <Text style={styles.couponAppliedCode}>
          {appliedCoupon.code} applied
        </Text>

        <Text style={styles.couponAppliedText}>
          You saved ₹{appliedCoupon.discountAmount.toFixed(0)}
        </Text>

      </View>

      <TouchableOpacity onPress={removeCoupon}>

        <Text style={styles.couponRemoveText}>
          Remove
        </Text>

      </TouchableOpacity>

    </View>

  ) : (

    <>

      <View style={styles.couponRow}>

        <TextInput
          allowFontScaling={false}
          placeholder="Enter coupon code"
          placeholderTextColor="#999"
          style={styles.couponInput}
          value={couponCode}
          onChangeText={setCouponCode}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={styles.couponApplyButton}
          activeOpacity={0.8}
          disabled={applyingCoupon}
          onPress={applyCoupon}
        >

          <Text style={styles.couponApplyText}>
            {applyingCoupon ? "..." : "Apply"}
          </Text>

        </TouchableOpacity>

      </View>

      {!!couponError && (

        <Text style={styles.couponError}>
          {couponError}
        </Text>

      )}

    </>

  )}

</View>


       {/* BILL DETAILS */}

<View
  style={styles.summary}
>

  <Text
    style={styles.sectionTitle}
  >
    Bill details
  </Text>


  {/* ITEMS TOTAL */}

  <View
    style={styles.summaryRow}
  >

    <Text
      style={styles.summaryLabel}
    >
      Items total
    </Text>


    <View
      style={styles.billRight}
    >

      <Text
  style={styles.mrpBill}
>
  Saved ₹
  {Math.max(
    0,
    cartItemsTotalMRP - subtotal
  ).toFixed(0)}
</Text>


      <Text
        style={styles.mrpBill}
      >
        ₹{cartItemsTotalMRP.toFixed(0)}
      </Text>


      <Text
        style={styles.billPrice}
      >
        ₹{subtotal.toFixed(0)}
      </Text>

    </View>

  </View>


  {/* DELIVERY */}

  <View
    style={styles.summaryRow}
  >

    <Text
      style={styles.summaryLabel}
    >
      Delivery charge
    </Text>


    <View
      style={styles.billRight}
    >

      {shippingAmount === 0 && (

        <Text
          style={styles.mrpBill}
        >
          ₹{shipping}
        </Text>

      )}


      <Text
        style={
          shippingAmount === 0
            ? styles.freeText
            : styles.summaryValue
        }
      >
        {shippingAmount === 0
          ? "FREE"
          : `₹${shippingAmount}`}
      </Text>

    </View>

  </View>


  {/* PLATFORM FEE */}

  <View
    style={styles.summaryRow}
  >

    <Text
      style={styles.summaryLabel}
    >
      Platform fee
    </Text>


    <Text
      style={styles.summaryValue}
    >
      ₹{platformFee.toFixed(0)}
    </Text>

  </View>


  {/* GST */}

  <View
    style={styles.summaryRow}
  >

    <Text
      style={styles.summaryLabel}
    >
      GST
    </Text>


    <Text
      style={styles.summaryValue}
    >
      ₹{gstAmount.toFixed(0)}
    </Text>

  </View>


  {/* COUPON DISCOUNT */}

  {appliedCoupon && (

    <View
      style={styles.summaryRow}
    >

      <Text
        style={styles.summaryLabel}
      >
        Coupon discount ({appliedCoupon.code})
      </Text>

      <Text
        style={styles.discountValue}
      >
        -₹{appliedCoupon.discountAmount.toFixed(0)}
      </Text>

    </View>

  )}


  {/* DIVIDER */}

  <View
    style={styles.totalDivider}
  />


  {/* GRAND TOTAL */}

  <View
    style={styles.summaryRow}
  >

    <Text
      style={styles.grandTotalLabel}
    >
      Grand total
    </Text>


    <Text
      style={styles.grandTotalValue}
    >
      ₹
      {(
        subtotal +
        shippingAmount +
        platformFee +
        gstAmount -
        (appliedCoupon?.discountAmount || 0)
      ).toFixed(0)}
    </Text>

  </View>


  {/* SAVINGS */}

  <View
    style={styles.savingsBox}
  >

    <Text
      style={styles.savingsTitle}
    >
      Your total savings
    </Text>


    <Text
      style={styles.savingsAmount}
    >
      ₹
      {(
        Math.max(
          0,
          cartItemsTotalMRP - subtotal
        ) +
        (shippingAmount === 0
          ? shipping
          : 0)
      ).toFixed(0)}
    </Text>


    <Text
      style={styles.savingsText}
    >
      Includes product savings
      {shippingAmount === 0
        ? " and free delivery"
        : ""}
    </Text>

  </View>


  {/* SECURITY */}

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


        {/* PLACE ORDER */}

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
              : `Place Order • ${formatPaymentMethod(paymentMethod)}`}
          </Text>

        </TouchableOpacity>


        <View
          style={styles.bottomSpace}
        />

      </ScrollView>

    </SafeAreaView>

  );
}


const styles =
  StyleSheet.create({

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


    savedAddressBanner: {
      backgroundColor: "#F3FFF6",
      marginTop: 7,
      marginHorizontal: 0,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: "#D7F0DD",
    },


    savedAddressTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: "#16A34A",
    },


    savedAddressText: {
      fontSize: 10,
      color: "#666666",
      marginTop: 2,
    },


    savedAddressRow: {
      flexDirection: "row",
      alignItems: "center",
    },


    changeAddressText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#16A34A",
      marginLeft: 10,
    },


    addressPickerList: {
      marginTop: 10,
    },


    addressPickerCard: {
      borderWidth: 1,
      borderColor: "#E2E8E4",
      borderRadius: 8,
      padding: 9,
      marginBottom: 7,
      backgroundColor: "#FFFFFF",
    },


    addressPickerCardActive: {
      borderColor: "#16A34A",
      backgroundColor: "#F3FFF6",
    },


    addressPickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },


    addressPickerName: {
      fontSize: 12,
      fontWeight: "700",
      color: "#222222",
    },


    addressPickerDefault: {
      fontSize: 9,
      fontWeight: "700",
      color: "#16A34A",
      backgroundColor: "#E9FFF1",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },


    addressPickerText: {
      fontSize: 11,
      color: "#777777",
      marginTop: 3,
    },


    slotRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },


    slotChip: {
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },


    slotChipActive: {
      backgroundColor: "#16A34A",
      borderColor: "#16A34A",
    },


    slotChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#555555",
    },


    slotChipTextActive: {
      color: "#FFFFFF",
    },


    bankOfferBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#F1F7FF",
      marginHorizontal: 0,
      marginTop: 7,
      padding: 12,
    },


    bankOfferIcon: {
      fontSize: 16,
      marginRight: 8,
    },


    bankOfferText: {
      flex: 1,
      fontSize: 11,
      color: "#333333",
      lineHeight: 16,
    },


    couponRow: {
      flexDirection: "row",
      alignItems: "center",
    },


    couponInput: {
      flex: 1,
      height: 42,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 11,
      fontSize: 13,
      color: "#222222",
      marginRight: 8,
    },


    couponApplyButton: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },


    couponApplyText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },


    couponError: {
      marginTop: 6,
      fontSize: 11,
      color: "#DC2626",
    },


    couponAppliedRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3FFF6",
      borderWidth: 1,
      borderColor: "#16A34A",
      borderRadius: 8,
      padding: 10,
    },


    couponAppliedCode: {
      fontSize: 13,
      fontWeight: "700",
      color: "#16A34A",
    },


    couponAppliedText: {
      fontSize: 11,
      color: "#555555",
      marginTop: 2,
    },


    couponRemoveText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#DC2626",
    },


    discountValue: {
      fontSize: 12,
      fontWeight: "700",
      color: "#16A34A",
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
billRight: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  flex: 1,
},

mrpBill: {
  fontSize: 12,
  color: "#777777",
  textDecorationLine: "line-through",
  marginRight: 6,
},

billPrice: {
  fontSize: 13,
  fontWeight: "700",
  color: "#222222",
},

freeText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#16A34A",
},

totalDivider: {
  borderTopWidth: 1,
  borderTopColor: "#EEEEEE",
  marginTop: 4,
  marginBottom: 9,
},

grandTotalLabel: {
  fontSize: 16,
  fontWeight: "800",
  color: "#222222",
},

grandTotalValue: {
  fontSize: 17,
  fontWeight: "800",
  color: "#16A34A",
},

savingsBox: {
  marginTop: 10,
  paddingTop: 10,
  paddingBottom: 8,
  borderTopWidth: 1,
  borderTopColor: "#EEEEEE",
  backgroundColor: "#F1F7FF",
  paddingHorizontal: 10,
  borderRadius: 8,
},

savingsTitle: {
  fontSize: 14,
  fontWeight: "800",
  color: "#4A90E2",
},

savingsAmount: {
  position: "absolute",
  right: 10,
  top: 10,
  fontSize: 15,
  fontWeight: "800",
  color: "#4A90E2",
},

savingsText: {
  fontSize: 10,
  color: "#555555",
  marginTop: 3,
  paddingRight: 70,
},

    bottomSpace: {
      height: 20,
    },

  });