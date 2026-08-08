import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  useRoute,
} from "@react-navigation/native";

import type {
  RouteProp,
} from "@react-navigation/native";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  createChat,
  sendMessage,
} from "../services/chatService";

import {
  RootStackParamList,
} from "../navigation/AppNavigator";


type ChatRouteProp =
  RouteProp<
    RootStackParamList,
    "Chat"
  >;


export default function ChatScreen() {

  const route =
    useRoute<ChatRouteProp>();

  const {
    productId,
    productName,
    vendorId,
    vendorName,
  } = route.params;


  const [chatId, setChatId] =
    useState<string | null>(null);

  const [messages, setMessages] =
    useState<any[]>([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);


  useEffect(() => {

    createCustomerChat();

  }, []);


  async function createCustomerChat() {

    try {

      const id =
        await createChat(
          productId,
          productName,
          vendorId,
          vendorName
        );

      setChatId(id);

    } catch (error) {

      console.log(
        "Chat creation error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to start chat."
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    if (!chatId) {
      return;
    }


    const messagesQuery =
      query(
        collection(
          db,
          "messages"
        ),
        where(
          "chatId",
          "==",
          chatId
        ),
        orderBy(
          "createdAt",
          "asc"
        )
      );


    const unsubscribe =
      onSnapshot(
        messagesQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...item.data(),
              })
            );

          setMessages(data);

        },
        (error) => {

          console.log(
            "Messages loading error:",
            error
          );

        }
      );


    return () =>
      unsubscribe();

  }, [chatId]);


  async function handleSend() {

    const text =
      message.trim();

    if (!text) {
      return;
    }

    if (!chatId) {
      return;
    }

    if (!auth.currentUser) {

      Alert.alert(
        "Login Required",
        "Please login before sending a message."
      );

      return;

    }


    try {

      setSending(true);

      await sendMessage(
        chatId,
        text
      );

      setMessage("");

    } catch (error) {

      console.log(
        "Message sending error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to send message."
      );

    } finally {

      setSending(false);

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
            size="large"
            color="#16A34A"
          />

          <Text
            style={styles.loadingText}
          >
            Starting chat...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            Chat with Seller
          </Text>

          <Text
            style={styles.seller}
          >
            {vendorName}
          </Text>

          <Text
            style={styles.product}
          >
            {productName}
          </Text>

        </View>


        <FlatList
          data={messages}
          keyExtractor={(
            item
          ) =>
            item.id
          }
          contentContainerStyle={
            styles.messages
          }
          ListEmptyComponent={

            <View
              style={styles.empty}
            >

              <Text
                style={styles.emptyTitle}
              >
                Start a conversation
              </Text>

              <Text
                style={styles.emptyText}
              >
                Send a message to
                {` ${vendorName}`}
              </Text>

            </View>

          }
          renderItem={({
            item,
          }) => {

            const isCustomer =
              item.senderId ===
              auth.currentUser?.uid;

            return (

              <View
                style={[
                  styles.messageRow,
                  isCustomer
                    ? styles.customerRow
                    : styles.sellerRow,
                ]}
              >

                <View
                  style={[
                    styles.messageBubble,
                    isCustomer
                      ? styles.customerBubble
                      : styles.sellerBubble,
                  ]}
                >

                  <Text
                    style={[
                      styles.messageText,
                      isCustomer
                        ? styles.customerText
                        : styles.sellerText,
                    ]}
                  >
                    {item.text}
                  </Text>

                </View>

              </View>

            );

          }}
        />


        <View
          style={styles.inputArea}
        >

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888888"
            value={message}
            onChangeText={
              setMessage
            }
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={
              handleSend
            }
            disabled={
              sending ||
              !message.trim()
            }
          >

            {sending ? (

              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

            ) : (

              <Text
                style={
                  styles.sendText
                }
              >
                Send
              </Text>

            )}

          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>

  );

}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F5F5",
    },

    keyboard: {
      flex: 1,
    },

    header: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 15,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: "#EEEEEE",
    },

    title: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222222",
    },

    seller: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "700",
      color: "#16A34A",
    },

    product: {
      marginTop: 2,
      fontSize: 11,
      color: "#777777",
    },

    messages: {
      padding: 12,
      paddingBottom: 20,
      flexGrow: 1,
    },

    messageRow: {
      width: "100%",
      marginBottom: 8,
      flexDirection: "row",
    },

    customerRow: {
      justifyContent: "flex-end",
    },

    sellerRow: {
      justifyContent: "flex-start",
    },

    messageBubble: {
      maxWidth: "78%",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
    },

    customerBubble: {
      backgroundColor: "#16A34A",
    },

    sellerBubble: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5E5E5",
    },

    messageText: {
      fontSize: 13,
      lineHeight: 18,
    },

    customerText: {
      color: "#FFFFFF",
    },

    sellerText: {
      color: "#333333",
    },

    inputArea: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
      padding: 10,
    },

    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: "#333333",
      textAlignVertical: "top",
    },

    sendButton: {
      marginLeft: 8,
      height: 42,
      minWidth: 62,
      paddingHorizontal: 12,
      borderRadius: 9,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
    },

    sendText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: "#777777",
    },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 100,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#333333",
    },

    emptyText: {
      marginTop: 5,
      fontSize: 12,
      color: "#777777",
    },

  });