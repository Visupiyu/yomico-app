import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type {
  RouteProp,
} from "@react-navigation/native";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type Ticket = {
  id: string;
  userId?: string;
  customerName?: string;
  userEmail?: string;
  subject?: string;
  category?: string;
  message?: string;
  status?: string;
  adminReply?: string;
  createdAt?: any;
};


export default function SupportScreen() {
      const route =
    useRoute<
      RouteProp<
        RootStackParamList,
        "Support"
      >
    >();

  const orderId =
    route.params?.orderId;

  const navigation =
    useNavigation();


  const [
    tickets,
    setTickets,
  ] =
    useState<Ticket[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


 const [
  subject,
  setSubject,
] =
  useState(
    orderId
      ? `Help with Order #${orderId}`
      : ""
  );


 const [
  category,
  setCategory,
] =
  useState(
    orderId
      ? "Order"
      : ""
  );
const [
  message,
  setMessage,
] =
  useState(
    orderId
      ? `I need help with my order #${orderId}.`
      : ""
  );


  useEffect(() => {

    loadTickets();

  }, []);


  async function loadTickets() {

    const user =
      auth.currentUser;


    if (!user) {

      setTickets([]);

      setLoading(false);

      return;

    }


    try {

      const ticketsQuery =
        query(
          collection(
            db,
            "tickets"
          ),
          where(
            "userId",
            "==",
            user.uid
          )
        );


      const snapshot =
        await getDocs(
          ticketsQuery
        );


      const items =
        snapshot.docs.map(
          (item) => ({

            id:
              item.id,

            ...item.data(),

          })
        ) as Ticket[];


      /*
        Sort newest tickets first.
        We do this locally so we don't
        require a Firestore composite index.
      */

      items.sort(
        (
          a,
          b
        ) => {

          const dateA =
            a.createdAt
              ?.toDate?.()
              ?.getTime?.() ||
            0;


          const dateB =
            b.createdAt
              ?.toDate?.()
              ?.getTime?.() ||
            0;


          return (
            dateB -
            dateA
          );

        }
      );


      setTickets(
        items
      );

    } catch (error) {

      console.log(
        "Support tickets loading error:",
        error
      );


      Alert.alert(
        "Error",
        "Unable to load support tickets."
      );

    } finally {

      setLoading(false);

    }

  }


  async function createTicket() {

    const user =
      auth.currentUser;


    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login to create a support ticket."
      );

      return;

    }


    const cleanSubject =
      subject.trim();


    const cleanCategory =
      category.trim();


    const cleanMessage =
      message.trim();


    if (!cleanSubject) {

      Alert.alert(
        "Missing Subject",
        "Please enter a subject."
      );

      return;

    }


    if (!cleanCategory) {

      Alert.alert(
        "Missing Category",
        "Please enter a category."
      );

      return;

    }


    if (!cleanMessage) {

      Alert.alert(
        "Missing Message",
        "Please describe your problem."
      );

      return;

    }


    try {

      setSubmitting(true);


      let customerName =
        user.displayName ||
        "";


      /*
        Try to get the customer's
        saved name from users collection.
      */

      try {

        const userQuery =
          query(
            collection(
              db,
              "users"
            ),
            where(
              "__name__",
              "==",
              user.uid
            )
          );


        const userSnapshot =
          await getDocs(
            userQuery
          );


        if (
          !userSnapshot.empty
        ) {

          const userData =
            userSnapshot.docs[0].data();


          customerName =
            userData.name ||
            customerName;

        }

      } catch (error) {

        console.log(
          "Customer name loading error:",
          error
        );

      }


      await addDoc(
        collection(
          db,
          "tickets"
        ),
        {

          userId:
            user.uid,

          customerName:
            customerName ||
            "YOMICO Customer",

          userEmail:
            user.email ||
            "",

          subject:
            cleanSubject,

          category:
            cleanCategory,

          message:
            cleanMessage,

          status:
            "Open",

          adminReply:
            "",

          createdAt:
            serverTimestamp(),

        }
      );


      setSubject("");

      setCategory("");

      setMessage("");


      await loadTickets();


      Alert.alert(
        "Ticket Created",
        "Your support ticket has been submitted successfully."
      );

    } catch (error) {

      console.log(
        "Create support ticket error:",
        error
      );


      Alert.alert(
        "Error",
        "Unable to create support ticket."
      );

    } finally {

      setSubmitting(false);

    }

  }


  function formatDate(
    timestamp: any
  ) {

    if (
      !timestamp
    ) {

      return "";

    }


    try {

      if (
        timestamp.toDate
      ) {

        return timestamp
          .toDate()
          .toLocaleString();

      }


      return new Date(
        timestamp
      ).toLocaleString();

    } catch {

      return "";

    }

  }


  function statusColor(
    status?: string
  ) {

    if (
      status ===
      "Resolved"
    ) {

      return "#16A34A";

    }


    if (
      status ===
      "In Progress"
    ) {

      return "#2563EB";

    }


    if (
      status ===
      "Closed"
    ) {

      return "#777777";

    }


    return "#F59E0B";

  }


  function renderTicket({
    item,
  }: {
    item: Ticket;
  }) {

    return (

      <View
        style={
          styles.ticketCard
        }
      >

        <View
          style={
            styles.ticketHeader
          }
        >

          <View
            style={
              styles.ticketHeaderLeft
            }
          >

            <MaterialIcons
              name="support-agent"
              size={21}
              color="#16A34A"
            />

            <Text
              style={
                styles.ticketSubject
              }
              numberOfLines={2}
            >
              {item.subject ||
                "Support Ticket"}
            </Text>

          </View>


          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusColor(
                    item.status
                  ) + "18",
              },
            ]}
          >

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusColor(
                      item.status
                    ),
                },
              ]}
            >
              {item.status ||
                "Open"}
            </Text>

          </View>

        </View>


        <Text
          style={
            styles.category
          }
        >
          Category:{" "}
          {item.category ||
            "-"}
        </Text>


        <Text
          style={
            styles.message
          }
        >
          {item.message ||
            ""}
        </Text>


        {item.adminReply ? (

          <View
            style={
              styles.replyBox
            }
          >

            <View
              style={
                styles.replyHeader
              }
            >

              <MaterialIcons
                name="support-agent"
                size={18}
                color="#2563EB"
              />

              <Text
                style={
                  styles.replyTitle
                }
              >
                Admin Reply
              </Text>

            </View>


            <Text
              style={
                styles.replyText
              }
            >
              {item.adminReply}
            </Text>

          </View>

        ) : (

          <View
            style={
              styles.waitingBox
            }
          >

            <MaterialIcons
              name="hourglass-empty"
              size={17}
              color="#F59E0B"
            />

            <Text
              style={
                styles.waitingText
              }
            >
              Waiting for admin reply
            </Text>

          </View>

        )}


        <Text
          style={
            styles.date
          }
        >
          {formatDate(
            item.createdAt
          )}
        </Text>

      </View>

    );

  }


  return (

    <SafeAreaView
      style={
        styles.container
      }
    >

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.goBack()
          }
        >

          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#222222"
          />

        </TouchableOpacity>


        <View
          style={
            styles.headerText
          }
        >

          <Text
            style={
              styles.title
            }
          >
            Help & Support
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            We're here to help
          </Text>

        </View>

      </View>


      <FlatList
        data={tickets}
        keyExtractor={
          (item) =>
            item.id
        }
        renderItem={
          renderTicket
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.list
        }
        ListHeaderComponent={

          <View>

            {/* CREATE TICKET */}

            <View
              style={
                styles.createCard
              }
            >

              <Text
                style={
                  styles.createTitle
                }
              >
                Create Support Ticket
              </Text>


              <Text
                style={
                  styles.createSubtitle
                }
              >
                Tell us how we can help you.
              </Text>


              <Text
                style={
                  styles.label
                }
              >
                Subject
              </Text>


              <TextInput
                style={
                  styles.input
                }
                placeholder="Example: Order problem"
                placeholderTextColor="#999999"
                value={subject}
                onChangeText={
                  setSubject
                }
              />


              <Text
                style={
                  styles.label
                }
              >
                Category
              </Text>


              <TextInput
                style={
                  styles.input
                }
                placeholder="Example: Order, Payment, Delivery"
                placeholderTextColor="#999999"
                value={category}
                onChangeText={
                  setCategory
                }
              />


              <Text
                style={
                  styles.label
                }
              >
                Message
              </Text>


              <TextInput
                style={
                  styles.messageInput
                }
                placeholder="Describe your problem..."
                placeholderTextColor="#999999"
                value={message}
                onChangeText={
                  setMessage
                }
                multiline
                textAlignVertical="top"
              />


              <TouchableOpacity
                style={
                  styles.submitButton
                }
                activeOpacity={0.8}
                onPress={
                  createTicket
                }
                disabled={
                  submitting
                }
              >

                {submitting ? (

                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                ) : (

                  <>

                    <MaterialIcons
                      name="send"
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.submitText
                      }
                    >
                      Submit Ticket
                    </Text>

                  </>

                )}

              </TouchableOpacity>

            </View>


            <View
              style={
                styles.sectionHeader
              }
            >

              <Text
                style={
                  styles.sectionTitle
                }
              >
                My Support Tickets
              </Text>


              <Text
                style={
                  styles.ticketCount
                }
              >
                {tickets.length}
              </Text>

            </View>


            {loading && (

              <View
                style={
                  styles.loading
                }
              >

                <ActivityIndicator
                  size="small"
                  color="#16A34A"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading tickets...
                </Text>

              </View>

            )}

          </View>
        }
        ListEmptyComponent={

          !loading ? (

            <View
              style={
                styles.empty
              }
            >

              <MaterialIcons
                name="support-agent"
                size={48}
                color="#BBBBBB"
              />


              <Text
                style={
                  styles.emptyTitle
                }
              >
                No Support Tickets
              </Text>


              <Text
                style={
                  styles.emptyText
                }
              >
                Your support requests
                will appear here.
              </Text>

            </View>

          ) : null

        }
      />

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#F5F5F5",
    },


    header: {
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
      flexDirection:
        "row",
      alignItems:
        "center",
    },


    headerText: {
      marginLeft: 12,
    },


    title: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222222",
    },


    subtitle: {
      fontSize: 11,
      color: "#777777",
      marginTop: 2,
    },


    list: {
      padding: 12,
      paddingBottom: 30,
    },


    createCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor:
        "#EEEEEE",
      marginBottom: 14,
    },


    createTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
    },


    createSubtitle: {
      fontSize: 11,
      color: "#777777",
      marginTop: 4,
      marginBottom: 12,
    },


    label: {
      fontSize: 11,
      fontWeight: "700",
      color: "#444444",
      marginTop: 9,
      marginBottom: 5,
    },


    input: {
      height: 43,
      borderWidth: 1,
      borderColor:
        "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 11,
      fontSize: 12,
      color: "#222222",
      backgroundColor:
        "#FFFFFF",
    },


    messageInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor:
        "#DDDDDD",
      borderRadius: 8,
      paddingHorizontal: 11,
      paddingVertical: 10,
      fontSize: 12,
      color: "#222222",
      backgroundColor:
        "#FFFFFF",
    },


    submitButton: {
      height: 44,
      borderRadius: 8,
      backgroundColor:
        "#16A34A",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop: 14,
    },


    submitText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginLeft: 6,
    },


    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 9,
    },


    sectionTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: "#222222",
    },


    ticketCount: {
      minWidth: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor:
        "#16A34A",
      color: "#FFFFFF",
      textAlign:
        "center",
      textAlignVertical:
        "center",
      fontSize: 11,
      fontWeight: "800",
      paddingTop: 5,
    },


    ticketCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 11,
      padding: 13,
      marginBottom: 10,
      borderWidth: 1,
      borderColor:
        "#EEEEEE",
    },


    ticketHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
    },


    ticketHeaderLeft: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginRight: 8,
    },


    ticketSubject: {
      flex: 1,
      fontSize: 13,
      fontWeight: "800",
      color: "#222222",
      marginLeft: 7,
    },


    statusBadge: {
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },


    statusText: {
      fontSize: 10,
      fontWeight: "800",
    },


    category: {
      fontSize: 10,
      color: "#777777",
      marginTop: 8,
    },


    message: {
      fontSize: 12,
      lineHeight: 18,
      color: "#444444",
      marginTop: 8,
    },


    replyBox: {
      backgroundColor:
        "#EFF6FF",
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },


    replyHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },


    replyTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: "#2563EB",
      marginLeft: 5,
    },


    replyText: {
      fontSize: 12,
      lineHeight: 18,
      color: "#333333",
      marginTop: 6,
    },


    waitingBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFFBEB",
      borderRadius: 7,
      padding: 8,
      marginTop: 10,
    },


    waitingText: {
      fontSize: 10,
      color: "#B45309",
      fontWeight: "600",
      marginLeft: 5,
    },


    date: {
      fontSize: 9,
      color: "#999999",
      marginTop: 9,
    },


    loading: {
      alignItems:
        "center",
      paddingVertical: 20,
    },


    loadingText: {
      fontSize: 11,
      color: "#777777",
      marginTop: 7,
    },


    empty: {
      alignItems:
        "center",
      paddingVertical: 30,
    },


    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: "#333333",
      marginTop: 9,
    },


    emptyText: {
      fontSize: 11,
      color: "#777777",
      marginTop: 4,
      textAlign:
        "center",
    },

  });