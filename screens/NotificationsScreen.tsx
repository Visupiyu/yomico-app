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
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  MaterialIcons,
} from "@expo/vector-icons";


export default function NotificationsScreen() {

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const user =
      auth.currentUser;

    if (!user) {

      setLoading(false);

      return;

    }


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

          setNotifications(
            data
          );

          setLoading(false);

        },
        (error) => {

          console.log(
            "Notification loading error:",
            error
          );

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
              markAsRead(
                item.id
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