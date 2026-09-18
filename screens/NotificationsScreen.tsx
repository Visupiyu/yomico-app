import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Notifications"
>;

export default function NotificationsScreen() {

  const navigation = useNavigation<NavigationProp>();

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  // Guards against a double-tap firing a second order fetch/navigation
  // while the first is still in flight, and shows a small inline spinner
  // on the exact card being opened.
  const [openingId, setOpeningId] =
    useState<string | null>(null);


  useEffect(() => {

    const user =
      auth.currentUser;

    if (!user) {

      setLoading(false);

      return;

    }


    // Scoped to THIS signed-in customer's own "customer" notifications only
    // — mirrors the existing web NotificationBell.tsx's userId+role query.
    // Firestore's security rules (allow read: isOwnerUid(resource.data.userId))
    // independently enforce this regardless of what the client queries for,
    // so a customer can never read another user's, or another role's, feed.
    const notificationsQuery =
  query(
    collection(
      db,
      "notifications"
    ),
    where(
      "userId",
      "==",
      user.uid
    ),
    where(
      "role",
      "==",
      "customer"
    )
  );


    const unsubscribe =
      onSnapshot(
        notificationsQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (item) => ({

                id:
                  item.id,

                ...item.data(),

              })
            );

          // No orderBy on the query itself (avoids requiring a composite
          // index — same reasoning as the web NotificationBell.tsx); sorted
          // newest-first here instead.
          data.sort(
            (a: any, b: any) =>
              (b.createdAt?.seconds || 0) -
              (a.createdAt?.seconds || 0)
          );

          setNotifications(
            data
          );

          setLoadError(false);

          setLoading(false);

        },
        (error) => {

          console.log(
            "Notification loading error:",
            error
          );

          setLoadError(true);

          setLoading(false);

        }
      );


    return () =>
      unsubscribe();

  }, []);


  async function markAsRead(
    id: string
  ) {

    try {

      await updateDoc(
        doc(
          db,
          "notifications",
          id
        ),
        {
          read: true,
        }
      );

    } catch (error) {

      console.log(
        "Notification update error:",
        error
      );

    }

  }


  // Opens the order this notification refers to, when it carries one
  // (orderId is only ever set by the Delivery Engine's delivery-lifecycle
  // notifications — see the backend's lib/deliveryEngine/notifications.ts;
  // the older order-placed notification carries none, so it stays a plain,
  // non-navigable list item exactly as it already was). OrderDetailsScreen
  // takes the FULL order object as its route param (not just an id), so the
  // order is fetched once here — a single document read, no new deep-link
  // infrastructure.
  async function openNotification(
    item: any
  ) {

    await markAsRead(item.id);

    if (!item.orderId || openingId) {
      return;
    }

    setOpeningId(item.id);

    try {

      const orderSnap =
        await getDoc(
          doc(db, "orders", item.orderId)
        );

      if (!orderSnap.exists()) {
        return;
      }

      navigation.navigate(
        "OrderDetails",
        {
          order: {
            id: orderSnap.id,
            ...orderSnap.data(),
          },
        }
      );

    } catch (error) {

      console.log(
        "Notification order open error:",
        error
      );

    } finally {

      setOpeningId(null);

    }

  }


  if (loading) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.loading}
        >

          <ActivityIndicator
            size="small"
            color="#16A34A"
          />

          <Text
            style={styles.loadingText}
          >
            Loading notifications...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  if (loadError) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.empty}
        >

          <MaterialIcons
            name="error-outline"
            size={48}
            color="#DC2626"
          />

          <Text
            style={styles.emptyTitle}
          >
            Couldn't Load Notifications
          </Text>

          <Text
            style={styles.emptyText}
          >
            Please check your connection
            and try again.
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Notifications
        </Text>

        <Text
          style={styles.subtitle}
        >
          Your latest updates
        </Text>

      </View>


      <FlatList
        data={notifications}
        keyExtractor={(
          item
        ) =>
          item.id
        }
        contentContainerStyle={
          notifications.length === 0
            ? styles.emptyList
            : styles.list
        }
        ListEmptyComponent={

          <View
            style={styles.empty}
          >

            <MaterialIcons
              name="notifications-none"
              size={48}
              color="#BBBBBB"
            />

            <Text
              style={styles.emptyTitle}
            >
              No Notifications
            </Text>

            <Text
              style={styles.emptyText}
            >
              Your important updates
              will appear here.
            </Text>

          </View>

        }
        renderItem={({
          item,
        }) => (

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              openNotification(
                item
              )
            }
            style={[
              styles.card,
              !item.read &&
                styles.unreadCard,
            ]}
          >

            <View
              style={styles.iconBox}
            >

              <MaterialIcons
                name="notifications"
                size={22}
                color="#16A34A"
              />

            </View>


            <View
              style={styles.content}
            >

              <View
                style={
                  styles.titleRow
                }
              >

                <Text
                  style={[
                    styles.notificationTitle,
                    !item.read &&
                      styles.unreadTitle,
                  ]}
                >
                {item.title ||
  item.tital ||
  "Notification"}
                </Text>

                {!item.read && (

                  <View
                    style={
                      styles.unreadDot
                    }
                  />

                )}

              </View>


              <Text
                style={styles.message}
              >
                {item.message}
              </Text>


              <Text
                style={styles.date}
              >
                {item.createdAt?.seconds
                  ? new Date(
                      item.createdAt.seconds *
                        1000
                    ).toLocaleString()
                  : ""}
              </Text>

            </View>

            {item.orderId ? (

              openingId === item.id ? (

                <ActivityIndicator
                  size="small"
                  color="#16A34A"
                  style={styles.chevron}
                />

              ) : (

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color="#BBBBBB"
                  style={styles.chevron}
                />

              )

            ) : null}

          </TouchableOpacity>

        )}
      />

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
      paddingHorizontal: 15,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    title: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222222",
    },

    subtitle: {
      marginTop: 3,
      fontSize: 11,
      color: "#777777",
    },

    list: {
      padding: 12,
    },

    emptyList: {
      flexGrow: 1,
      padding: 12,
    },

    card: {
      flexDirection: "row",
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      padding: 12,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    unreadCard: {
      borderColor: "#BBF7D0",
    },

    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#F0FDF4",
      alignItems: "center",
      justifyContent: "center",
    },

    content: {
      flex: 1,
      marginLeft: 10,
    },

    chevron: {
      alignSelf: "center",
      marginLeft: 6,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    notificationTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: "#333333",
    },

    unreadTitle: {
      fontWeight: "800",
      color: "#111111",
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#16A34A",
      marginLeft: 6,
    },

    message: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 18,
      color: "#555555",
    },

    date: {
      marginTop: 7,
      fontSize: 10,
      color: "#999999",
    },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 8,
      fontSize: 12,
      color: "#777777",
    },

  });