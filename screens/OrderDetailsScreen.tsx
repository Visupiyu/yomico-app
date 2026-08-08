import React from "react";

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";

import { RouteProp, useRoute } from "@react-navigation/native";

import { RootStackParamList } from "../navigation/AppNavigator";


type OrderDetailsRouteProp =
  RouteProp<
    RootStackParamList,
    "OrderDetails"
  >;


export default function OrderDetailsScreen() {

  const route =
    useRoute<OrderDetailsRouteProp>();

  const { order } =
    route.params;


  function formatDate(
    timestamp: any
  ) {

    if (
      !timestamp ||
      !timestamp.toDate
    ) {
      return "Date unavailable";
    }

    return timestamp
      .toDate()
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
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
            style={styles.title}
          >
            Order Details
          </Text>

          <Text
            style={styles.orderId}
            numberOfLines={1}
          >
            Order #{order.id}
          </Text>

        </View>


        {/* STATUS */}

        <View
          style={styles.statusCard}
        >

          <Text
            style={styles.statusLabel}
          >
            Order Status
          </Text>

          <View
            style={styles.statusBadge}
          >

            <Text
              style={styles.statusText}
            >
              {order.status ||
                "Pending"}
            </Text>

          </View>

        </View>


        {/* PRODUCTS */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Items
          </Text>


          {order.items?.map(
            (
              item: any,
              index: number
            ) => (

              <View
                key={
                  item.id ||
                  item.productId ||
                  index
                }
                style={styles.productRow}
              >

                {item.image ? (

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={
                      styles.productImage
                    }
                  />

                ) : (

                  <View
                    style={
                      styles.imagePlaceholder
                    }
                  >

                    <Text>
                      📦
                    </Text>

                  </View>

                )}


                <View
                  style={
                    styles.productInfo
                  }
                >

                  <Text
                    style={
                      styles.productName
                    }
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>


                  <Text
                    style={
                      styles.vendor
                    }
                  >
                    Sold by:{" "}
                    {item.vendorName ||
                      "YOMICO Seller"}
                  </Text>


                  <Text
                    style={
                      styles.quantity
                    }
                  >
                    Qty: {item.quantity}
                  </Text>

                </View>


                <Text
                  style={
                    styles.productPrice
                  }
                >
                  ₹{item.price}
                </Text>

              </View>

            )
          )}

        </View>


        {/* DELIVERY */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Delivery Address
          </Text>


          <Text
            style={styles.customerName}
          >
            {order.customerName}
          </Text>


          <Text
            style={styles.address}
          >
            {order.deliveryAddress}
          </Text>


          <Text
            style={styles.address}
          >
            {order.city} -{" "}
            {order.pincode}
          </Text>


          <Text
            style={styles.mobile}
          >
            Mobile:{" "}
            {order.customerMobile}
          </Text>

        </View>


        {/* PAYMENT */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Payment
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Payment Method
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order.paymentMethod ||
                "COD"}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Payment Status
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order.paymentStatus ||
                "Pending"}
            </Text>

          </View>

        </View>


        {/* ORDER INFORMATION */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Order Information
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Order Date
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                order.createdAt
              )}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Customer Email
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {order.customerEmail}
            </Text>

          </View>

        </View>


        {/* PRICE SUMMARY */}

        <View
          style={styles.summary}
        >

          <Text
            style={styles.sectionTitle}
          >
            Price Details
          </Text>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Subtotal
            </Text>

            <Text
              style={styles.infoValue}
            >
              ₹{order.subtotal}
            </Text>

          </View>


          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.infoLabel}
            >
              Shipping
            </Text>

            <Text
              style={styles.infoValue}
            >
              ₹{order.shipping}
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
              ₹{order.total}
            </Text>

          </View>

        </View>


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
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },


    title: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222222",
    },


    orderId: {
      fontSize: 10,
      color: "#888888",
      marginTop: 3,
    },


    statusCard: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },


    statusLabel: {
      fontSize: 13,
      color: "#555555",
      fontWeight: "600",
    },


    statusBadge: {
      backgroundColor: "#FFF4D6",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },


    statusText: {
      fontSize: 11,
      color: "#A66A00",
      fontWeight: "700",
    },


    section: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },


    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
      marginBottom: 10,
    },


    productRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },


    productImage: {
      width: 65,
      height: 65,
      borderRadius: 7,
      backgroundColor: "#F5F5F5",
    },


    imagePlaceholder: {
      width: 65,
      height: 65,
      borderRadius: 7,
      backgroundColor: "#F5F5F5",
      alignItems: "center",
      justifyContent: "center",
    },


    productInfo: {
      flex: 1,
      marginLeft: 9,
    },


    productName: {
      fontSize: 13,
      fontWeight: "700",
      color: "#222222",
      lineHeight: 17,
    },


    vendor: {
      fontSize: 10,
      color: "#777777",
      marginTop: 3,
    },


    quantity: {
      fontSize: 11,
      color: "#555555",
      marginTop: 3,
    },


    productPrice: {
      fontSize: 14,
      fontWeight: "800",
      color: "#16A34A",
      marginLeft: 5,
    },


    customerName: {
      fontSize: 13,
      fontWeight: "700",
      color: "#222222",
    },


    address: {
      fontSize: 12,
      color: "#555555",
      marginTop: 4,
      lineHeight: 17,
    },


    mobile: {
      fontSize: 11,
      color: "#666666",
      marginTop: 6,
    },


    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },


    infoLabel: {
      fontSize: 12,
      color: "#666666",
    },


    infoValue: {
      flex: 1,
      marginLeft: 12,
      textAlign: "right",
      fontSize: 12,
      color: "#333333",
      fontWeight: "600",
    },


    summary: {
      backgroundColor: "#FFFFFF",
      marginTop: 7,
      padding: 14,
    },


    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
      paddingTop: 9,
      marginTop: 3,
    },


    totalLabel: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222222",
    },


    total: {
      fontSize: 17,
      fontWeight: "800",
      color: "#16A34A",
    },


    bottomSpace: {
      height: 25,
    },

  });