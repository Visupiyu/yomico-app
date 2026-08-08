import React, { useEffect, useState } from "react";

import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


export default function OrdersScreen() {

  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

const navigation =
  useNavigation<
    NativeStackNavigationProp<
      RootStackParamList,
      "Orders"
    >
  >();
  useEffect(() => {
    loadOrders();
  }, []);


  async function loadOrders() {

    const user =
      auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }


    try {

      const ordersQuery =
  query(
    collection(db, "orders"),
    where(
      "userId",
      "==",
      user.uid
    )
  );


      const snapshot =
        await getDocs(
          ordersQuery
        );


      const orderData =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );


      setOrders(orderData);

    } catch (error) {

      console.log(
        "Orders loading error:",
        error
      );

    } finally {

      setLoading(false);

    }
  }


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


  if (loading) {
function getStatusStyle(
  status?: string
) {
  switch (status) {

    case "Confirmed":
      return {
        backgroundColor: "#E0F2FE",
        textColor: "#0284C7",
      };

    case "Packed":
      return {
        backgroundColor: "#EDE9FE",
        textColor: "#7C3AED",
      };

    case "Shipped":
      return {
        backgroundColor: "#E0E7FF",
        textColor: "#4F46E5",
      };

    case "Out for delivery":
      return {
        backgroundColor: "#FFF7ED",
        textColor: "#EA580C",
      };

    case "Delivered":
      return {
        backgroundColor: "#DCFCE7",
        textColor: "#16A34A",
      };

    case "Cancelled":
      return {
        backgroundColor: "#FEE2E2",
        textColor: "#DC2626",
      };

    case "Pending":
    default:
      return {
        backgroundColor: "#FFF4D6",
        textColor: "#A66A00",
      };

  }
}
    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.loadingContainer}
        >

          <ActivityIndicator
            size="small"
            color="#16A34A"
          />

          <Text
            style={styles.loadingText}
          >
            Loading orders...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <Text
        style={styles.title}
      >
        My Orders
      </Text>


      {orders.length === 0 ? (

        <View
          style={styles.emptyContainer}
        >

          <Text
            style={styles.emptyIcon}
          >
            📦
          </Text>

          <Text
            style={styles.emptyTitle}
          >
            No Orders Yet
          </Text>

          <Text
            style={styles.emptyText}
          >
            Your placed orders will
            appear here.
          </Text>

        </View>

      ) : (

        <FlatList

          data={orders}

          keyExtractor={(item) =>
            item.id
          }

          showsVerticalScrollIndicator={
            false
          }

          contentContainerStyle={
            styles.list
          }

          renderItem={({
            item,
          }) => {

            const firstItem =
              item.items &&
              item.items.length > 0
                ? item.items[0]
                : null;


            return (

              <TouchableOpacity
  style={styles.orderCard}
  activeOpacity={0.8}
  onPress={() =>
    navigation.navigate(
      "OrderDetails",
      {
        order: item,
      }
    )
  }
>

                <View
                  style={styles.orderHeader}
                >

                  <Text
                    style={
                      styles.orderLabel
                    }
                  >
                    Order
                  </Text>

                  <Text
                    style={
                      styles.orderId
                    }
                    numberOfLines={1}
                  >
                    #{item.id}
                  </Text>

                </View>


                {firstItem && (

                  <View
                    style={styles.productRow}
                  >

                    {firstItem.image ? (

                      <Image
                        source={{
                          uri:
                            firstItem.image,
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
                        {firstItem.name}
                      </Text>


                      <Text
                        style={
                          styles.quantity
                        }
                      >
                        Qty:{" "}
                        {firstItem.quantity}
                      </Text>


                      <Text
                        style={
                          styles.vendor
                        }
                        numberOfLines={1}
                      >
                        Sold by:{" "}
                        {
                          firstItem.vendorName ||
                          "YOMICO Seller"
                        }
                      </Text>

                    </View>


                    <Text
                      style={
                        styles.productPrice
                      }
                    >
                      ₹{firstItem.price}
                    </Text>

                  </View>

                )}


                {item.items &&
                  item.items.length >
                    1 && (

                  <Text
                    style={
                      styles.moreItems
                    }
                  >
                    +
                    {item.items.length - 1}
                    {" "}
                    more item
                    {item.items.length -
                      1 >
                    1
                      ? "s"
                      : ""}
                  </Text>

                )}


                <View
                  style={
                    styles.divider
                  }
                />


                <View
                  style={
                    styles.infoRow
                  }
                >

                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Order Date
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {formatDate(
                      item.createdAt
                    )}
                  </Text>

                </View>


                <View
                  style={
                    styles.infoRow
                  }
                >

                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Payment
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {
                      item.paymentMethod ||
                      "COD"
                    }
                  </Text>

                </View>


                <View
                  style={
                    styles.infoRow
                  }
                >

                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Total
                  </Text>

                  <Text
                    style={
                      styles.totalValue
                    }
                  >
                    ₹{item.total}
                  </Text>

                </View>


                <View
                  style={
                    styles.statusRow
                  }
                >

                  <Text
                    style={
                      styles.statusLabel
                    }
                  >
                    Order Status
                  </Text>

<View
  style={[
    styles.statusBadge,
    item.status === "Delivered"
      ? styles.statusDelivered
      : item.status === "Cancelled"
      ? styles.statusCancelled
      : item.status === "Confirmed"
      ? styles.statusConfirmed
      : item.status === "Packed"
      ? styles.statusPacked
      : item.status === "Shipped"
      ? styles.statusShipped
      : item.status === "Out for delivery"
      ? styles.statusOutForDelivery
      : styles.statusPending,
  ]}
>
  <Text
    style={[
      styles.statusText,
      item.status === "Delivered"
        ? styles.statusTextDelivered
        : item.status === "Cancelled"
        ? styles.statusTextCancelled
        : item.status === "Confirmed"
        ? styles.statusTextConfirmed
        : item.status === "Packed"
        ? styles.statusTextPacked
        : item.status === "Shipped"
        ? styles.statusTextShipped
        : item.status === "Out for delivery"
        ? styles.statusTextOutForDelivery
        : styles.statusTextPending,
    ]}
  >
    {item.status || "Pending"}
  </Text>
</View>
                </View>

              </TouchableOpacity>

            );

          }}

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


    title: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222222",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },


    list: {
      padding: 12,
      paddingBottom: 25,
    },


    orderCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      elevation: 2,
    },


    orderHeader: {
      flexDirection: "row",
      alignItems: "center",
    },


    orderLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#555555",
    },


    orderId: {
      flex: 1,
      marginLeft: 6,
      fontSize: 10,
      color: "#888888",
    },


    productRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },


    productImage: {
      width: 70,
      height: 70,
      borderRadius: 8,
      backgroundColor: "#F5F5F5",
    },


    imagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 8,
      backgroundColor: "#F5F5F5",
      alignItems: "center",
      justifyContent: "center",
    },


    productInfo: {
      flex: 1,
      marginLeft: 10,
    },


    productName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222222",
      lineHeight: 18,
    },


    quantity: {
      fontSize: 11,
      color: "#666666",
      marginTop: 4,
    },


    vendor: {
      fontSize: 10,
      color: "#777777",
      marginTop: 3,
    },


    productPrice: {
      fontSize: 14,
      fontWeight: "800",
      color: "#16A34A",
      marginLeft: 6,
    },


    moreItems: {
      fontSize: 11,
      color: "#16A34A",
      fontWeight: "600",
      marginTop: 7,
    },


    divider: {
      height: 1,
      backgroundColor: "#EEEEEE",
      marginVertical: 10,
    },


    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
    },


    infoLabel: {
      fontSize: 12,
      color: "#666666",
    },


    infoValue: {
      fontSize: 12,
      color: "#333333",
      fontWeight: "600",
    },


    totalValue: {
      fontSize: 15,
      color: "#16A34A",
      fontWeight: "800",
    },


    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 3,
    },


    statusLabel: {
      fontSize: 12,
      color: "#555555",
      fontWeight: "600",
    },

statusBadge: {
  paddingHorizontal: 9,
  paddingVertical: 4,
  borderRadius: 6,
},

statusText: {
  fontSize: 11,
  fontWeight: "700",
},

statusPending: {
  backgroundColor: "#FFF4D6",
},

statusConfirmed: {
  backgroundColor: "#E0F2FE",
},

statusPacked: {
  backgroundColor: "#EDE9FE",
},

statusShipped: {
  backgroundColor: "#E0E7FF",
},

statusOutForDelivery: {
  backgroundColor: "#FFF7ED",
},

statusDelivered: {
  backgroundColor: "#DCFCE7",
},

statusCancelled: {
  backgroundColor: "#FEE2E2",
},

statusTextPending: {
  color: "#A66A00",
},

statusTextConfirmed: {
  color: "#0284C7",
},

statusTextPacked: {
  color: "#7C3AED",
},

statusTextShipped: {
  color: "#4F46E5",
},

statusTextOutForDelivery: {
  color: "#EA580C",
},

statusTextDelivered: {
  color: "#16A34A",
},

statusTextCancelled: {
  color: "#DC2626",
},


    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },


    loadingText: {
      marginTop: 8,
      fontSize: 12,
      color: "#777777",
    },


    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
    },


    emptyIcon: {
      fontSize: 42,
    },


    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222222",
      marginTop: 10,
    },


    emptyText: {
      fontSize: 12,
      color: "#777777",
      marginTop: 5,
      textAlign: "center",
    },

  });